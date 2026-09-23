import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryUserDto } from './dto/query-user.dto';

/** Field user yang aman dikembalikan ke client (tanpa password) */
const AVATAR_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const USER_SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  bio: true,
  angkatan: true,
  avatarId: true,
  avatar: {
    select: {
      id: true,
      url: true,
      fileName: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. Ambil semua user dengan filter & pagination (Khusus Admin)
  // ==========================================
  async findAll(query: QueryUserDto) {
    const { search, role, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // Filter berdasarkan role
    if (role) {
      where.role = role;
    }

    // Search berdasarkan nama ATAU email (case-insensitive)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_SAFE_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  // ==========================================
  // 1b. Direktori Anggota Publik (Halaman /anggota)
  // ==========================================
  /**
   * Daftar anggota untuk ditampilkan publik — cuma field non-sensitif
   * (tanpa email/phone/bio/role akun). Hanya anggota yang angkatan-nya
   * sudah diisi admin yang muncul (mencegah akun yang belum diverifikasi
   * admin ikut tampil). Jabatan diambil dari struktur di periode aktif,
   * kalau ada.
   */
  async findPublicDirectory() {
    const users = await this.prisma.user.findMany({
      where: { angkatan: { not: null } },
      select: {
        id: true,
        name: true,
        angkatan: true,
        avatar: { select: { url: true } },
        structures: {
          where: { period: { isActive: true } },
          select: { position: { select: { name: true, level: true } } },
          take: 1,
        },
      },
      orderBy: [{ angkatan: 'desc' }, { name: 'asc' }],
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      angkatan: user.angkatan,
      avatarUrl: user.avatar?.url ?? null,
      position: user.structures[0]?.position.name ?? null,
    }));
  }

  // ==========================================
  // 2. Ambil profil berdasarkan ID
  // ==========================================
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SAFE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    return user;
  }

  // ==========================================
  // 3. Update Profil Diri Sendiri
  // ==========================================
  async updateProfile(id: string, dto: UpdateProfileDto) {
    // Pastikan user ada
    await this.findById(id);

    // Jika avatarId dikirim, validasi bahwa media tersebut ada
    if (dto.avatarId) {
      const media = await this.prisma.media.findUnique({
        where: { id: dto.avatarId },
      });
      if (!media) {
        throw new NotFoundException('Media avatar tidak ditemukan');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SAFE_SELECT,
    });
  }

  // ==========================================
  // 4. Upload Foto Profil (Avatar)
  // ==========================================
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diunggah');
    }

    // Validasi tipe file
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format file tidak didukung. Gunakan JPEG, PNG, atau WebP',
      );
    }

    // Validasi ukuran file (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Ukuran file maksimal 2MB');
    }

    // Pastikan folder uploads/avatars ada
    const uploadDir = join(process.cwd(), 'uploads', 'avatars');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Generate nama file unik
    // Ekstensi dari mimetype yang sudah divalidasi, bukan dari nama file
    // buatan client (cegah upload .html dsb. yang di-serve dari origin ini).
    const fileExt = AVATAR_EXTENSIONS[file.mimetype];
    const uniqueFileName = `avatar-${userId}-${randomUUID()}${fileExt}`;
    const filePath = join(uploadDir, uniqueFileName);

    // Simpan file ke disk
    writeFileSync(filePath, file.buffer);

    // URL yang bisa diakses publik. Prefix /api wajib ada karena di domain
    // publik, Traefik cuma meneruskan path yang diawali /api ke backend ini
    // (lihat docker-compose.yml) — tanpa prefix ini URL-nya akan 404.
    const fileUrl = `/api/uploads/avatars/${uniqueFileName}`;

    // Ambil data user lama untuk hapus avatar lama jika ada
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { avatar: true },
    });

    // Jalankan dalam transaksi: buat Media record + update User
    const [, updatedUser] = await this.prisma.$transaction(async (tx) => {
      // Buat record baru di tabel Media
      const newMedia = await tx.media.create({
        data: {
          fileName: uniqueFileName,
          url: fileUrl,
          mimeType: file.mimetype,
          size: file.size,
          uploaderId: userId,
        },
      });

      // Update user dengan avatarId baru
      const user = await tx.user.update({
        where: { id: userId },
        data: { avatarId: newMedia.id },
        select: USER_SAFE_SELECT,
      });

      return [newMedia, user];
    });

    // Hapus file lama dari disk jika ada dan bukan avatar default
    // Hanya hapus file hasil upload avatar user ini sendiri (nama file memuat
    // userId). `avatarId` di PATCH /user/me bisa menunjuk media milik orang
    // lain (mis. cover berita); file seperti itu tidak boleh ikut terhapus.
    if (
      existingUser?.avatar?.url &&
      existingUser.avatar.url.includes(`/avatars/avatar-${userId}-`)
    ) {
      try {
        // URL publik ("/api/uploads/...") berbeda dari path fisik di disk
        // ("uploads/..." relatif terhadap cwd, tanpa prefix /api — lihat
        // main.ts useStaticAssets). Ganti prefix URL-nya, bukan cuma
        // buang leading slash, supaya path fisiknya benar.
        const relativePath = existingUser.avatar.url.replace(
          /^\/api\/uploads\//,
          'uploads/',
        );
        const oldFilePath = join(process.cwd(), relativePath);
        // Hapus record Media dulu; file baru dihapus jika DB berhasil, supaya
        // gagal-hapus-DB tidak meninggalkan record dengan file yang hilang.
        await this.prisma.media.delete({
          where: { id: existingUser.avatarId! },
        });
        if (existsSync(oldFilePath)) {
          unlinkSync(oldFilePath);
        }
      } catch {
        // Lanjutkan meski gagal hapus file lama
      }
    }

    return {
      message: 'Foto profil berhasil diperbarui',
      user: updatedUser,
    };
  }

  // ==========================================
  // 5. Update Role User (Khusus Admin)
  // ==========================================
  async updateRole(id: string, dto: UpdateRoleDto, currentUserId: string) {
    await this.findById(id); // Pastikan user ada

    // Cegah admin menurunkan role dirinya sendiri — jika satu-satunya admin
    // melakukannya, tidak ada lagi yang bisa mengelola sistem.
    if (id === currentUserId && dto.role !== Role.ADMIN) {
      throw new BadRequestException('Tidak dapat menurunkan role akun sendiri');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  // ==========================================
  // 6. Hapus User (Khusus Admin)
  // ==========================================
  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Tidak dapat menghapus akun sendiri');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { avatar: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    try {
      const deleted = await this.prisma.user.delete({
        where: { id },
      });

      // Hapus file avatar dari disk hanya setelah user benar-benar terhapus.
      // URL publik ("/api/uploads/...") ≠ path fisik ("uploads/...").
      if (user.avatar?.url) {
        try {
          const oldFilePath = join(
            process.cwd(),
            user.avatar.url.replace(/^\/api\/uploads\//, 'uploads/'),
          );
          if (existsSync(oldFilePath)) {
            unlinkSync(oldFilePath);
          }
        } catch {
          // Lanjutkan meski gagal
        }
      }

      return deleted;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'User tidak dapat dihapus karena masih memiliki data terkait (mis. transaksi keuangan, berita, atau struktur organisasi yang tercatat atas namanya)',
        );
      }
      throw error;
    }
  }
}
