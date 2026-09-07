import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryUserDto } from './dto/query-user.dto';

/** Field user yang aman dikembalikan ke client (tanpa password) */
const USER_SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  bio: true,
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

    const where: any = {};

    // Filter berdasarkan role
    if (role) {
      where.role = role;
    }

    // Search berdasarkan nama ATAU email (case-insensitive)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
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
    const fileExt = extname(file.originalname);
    const uniqueFileName = `avatar-${userId}-${randomUUID()}${fileExt}`;
    const filePath = join(uploadDir, uniqueFileName);

    // Simpan file ke disk
    writeFileSync(filePath, file.buffer);

    // URL yang bisa diakses publik
    const fileUrl = `/uploads/avatars/${uniqueFileName}`;

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
    if (existingUser?.avatar?.url) {
      try {
        const oldFilePath = join(
          process.cwd(),
          existingUser.avatar.url.replace(/^\//, ''),
        );
        if (existsSync(oldFilePath)) {
          unlinkSync(oldFilePath);
        }
        // Hapus record Media lama
        await this.prisma.media.delete({
          where: { id: existingUser.avatarId! },
        });
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
  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.findById(id); // Pastikan user ada

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
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { avatar: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    // Hapus file avatar dari disk jika ada
    if (user.avatar?.url) {
      try {
        const oldFilePath = join(
          process.cwd(),
          user.avatar.url.replace(/^\//, ''),
        );
        if (existsSync(oldFilePath)) {
          unlinkSync(oldFilePath);
        }
      } catch {
        // Lanjutkan meski gagal
      }
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}