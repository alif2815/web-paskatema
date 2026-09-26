import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  BulkMemberStatusDto,
  UpdateProfileDto,
} from './dto/update-profile.dto';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';
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
  memberStatus: true,
  education: true,
  occupation: true,
  skills: true,
  linkedinUrl: true,
  instagram: true,
  profilePublic: true,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
        memberStatus: true,
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
      memberStatus: user.memberStatus,
      avatarUrl: user.avatar?.url ?? null,
      position: user.structures[0]?.position.name ?? null,
    }));
  }

  // ==========================================
  // 1c. Profil Anggota (Halaman /anggota/:id)
  // ==========================================
  /**
   * Profil satu anggota. Semua orang melihat data dasar (nama, angkatan,
   * status, riwayat jabatan). Detail ala LinkedIn (pendidikan, pekerjaan,
   * keahlian, tautan, bio) hanya untuk admin & anggota ber-angkatan yang
   * login, atau publik bila anggota PURNA memilih profilePublic.
   */
  async findMemberProfile(id: string, viewer: AuthenticatedUser | null) {
    const user = await this.prisma.user.findFirst({
      where: { id, angkatan: { not: null } },
      select: {
        id: true,
        name: true,
        angkatan: true,
        memberStatus: true,
        bio: true,
        education: true,
        occupation: true,
        skills: true,
        linkedinUrl: true,
        instagram: true,
        profilePublic: true,
        avatar: { select: { url: true } },
        structures: {
          select: {
            position: { select: { name: true, level: true } },
            period: { select: { name: true, isActive: true } },
          },
          orderBy: { period: { name: 'desc' } },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Anggota tidak ditemukan');
    }

    let canSeeDetails =
      user.profilePublic && user.memberStatus === MemberStatus.PURNA;
    if (!canSeeDetails && viewer) {
      if (viewer.role === Role.ADMIN || viewer.id === user.id) {
        canSeeDetails = true;
      } else {
        const me = await this.prisma.user.findUnique({
          where: { id: viewer.id },
          select: { angkatan: true },
        });
        canSeeDetails = me?.angkatan != null;
      }
    }

    const basic = {
      id: user.id,
      name: user.name,
      angkatan: user.angkatan,
      memberStatus: user.memberStatus,
      avatarUrl: user.avatar?.url ?? null,
      positions: user.structures.map((s) => ({
        position: s.position.name,
        period: s.period.name,
        isActive: s.period.isActive,
      })),
      detailsVisible: canSeeDetails,
    };
    if (!canSeeDetails) {
      return basic;
    }
    return {
      ...basic,
      bio: user.bio,
      education: user.education,
      occupation: user.occupation,
      skills: user.skills,
      linkedinUrl: user.linkedinUrl,
      instagram: user.instagram,
    };
  }

  /** Ubah status Aktif/Purna seluruh anggota satu angkatan (admin). */
  async bulkMemberStatus(dto: BulkMemberStatusDto) {
    const result = await this.prisma.user.updateMany({
      where: { angkatan: dto.angkatan },
      data: {
        memberStatus: dto.memberStatus,
        // Profil publik hanya untuk Purna.
        ...(dto.memberStatus === MemberStatus.AKTIF && {
          profilePublic: false,
        }),
      },
    });
    return {
      message: `${result.count} anggota Angkatan ${dto.angkatan} kini berstatus ${dto.memberStatus === MemberStatus.PURNA ? 'Purna' : 'Aktif'}`,
      count: result.count,
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
    const current = await this.findById(id);

    // Jika avatarId dikirim, validasi bahwa media tersebut ada
    if (dto.avatarId) {
      const media = await this.prisma.media.findUnique({
        where: { id: dto.avatarId },
      });
      if (!media) {
        throw new NotFoundException('Media avatar tidak ditemukan');
      }
    }

    const text = (v: string | null | undefined) =>
      v === undefined ? undefined : v?.trim() || null;
    const data: Prisma.UserUpdateInput = {
      ...dto,
      ...(dto.education !== undefined && { education: text(dto.education) }),
      ...(dto.occupation !== undefined && { occupation: text(dto.occupation) }),
      ...(dto.linkedinUrl !== undefined && {
        linkedinUrl: text(dto.linkedinUrl),
      }),
      ...(dto.instagram !== undefined && {
        instagram: text(dto.instagram)?.replace(/^@/, '') ?? null,
      }),
      ...(dto.skills !== undefined && {
        skills: [...new Set(dto.skills.map((s) => s.trim()).filter(Boolean))],
      }),
    };

    // Profil publik hanya untuk Purna (anggota Aktif umumnya masih siswa).
    const status = dto.memberStatus ?? current.memberStatus;
    if (dto.profilePublic === true && status !== MemberStatus.PURNA) {
      throw new BadRequestException(
        'Profil publik hanya tersedia untuk anggota berstatus Purna',
      );
    }
    if (status !== MemberStatus.PURNA) {
      data.profilePublic = false;
    }

    return this.prisma.user.update({
      where: { id },
      data,
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

    // Nama unik; ekstensi dari mimetype yang sudah divalidasi, bukan dari nama
    // file buatan client (cegah upload .html dsb. yang di-serve dari origin ini).
    const baseName = `avatar-${userId}-${randomUUID()}`;
    const extension = AVATAR_EXTENSIONS[file.mimetype];

    // Simpan lewat StorageService: disk lokal, atau Cloudinary jika di-set.
    const stored = await this.storage.saveBuffer(file.buffer, {
      subfolder: 'avatars',
      baseName,
      extension,
    });

    // Ambil data user lama untuk hapus avatar lama jika ada
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { avatar: true },
    });

    // Jalankan dalam transaksi: buat Media record + update User
    const [, updatedUser] = await this.prisma
      .$transaction(async (tx) => {
        const newMedia = await tx.media.create({
          data: {
            fileName: `${baseName}${extension}`,
            url: stored.url,
            publicId: stored.publicId,
            mimeType: file.mimetype,
            size: file.size,
            uploaderId: userId,
          },
        });

        const user = await tx.user.update({
          where: { id: userId },
          data: { avatarId: newMedia.id },
          select: USER_SAFE_SELECT,
        });

        return [newMedia, user] as const;
      })
      .catch(async (error: unknown) => {
        // Jangan tinggalkan file yatim jika transaksi gagal.
        await this.storage.remove(stored);
        throw error;
      });

    // Hapus avatar lama. Hanya yang hasil upload avatar user ini sendiri (nama
    // memuat userId): `avatarId` di PATCH /user/me bisa menunjuk media milik
    // orang lain (mis. cover berita), dan itu tidak boleh ikut terhapus.
    const old = existingUser?.avatar;
    if (old && (old.publicId ?? old.url).includes(`avatar-${userId}-`)) {
      try {
        // Hapus record Media dulu; file baru dihapus jika DB berhasil, supaya
        // gagal-hapus-DB tidak meninggalkan record dengan file yang hilang.
        await this.prisma.media.delete({ where: { id: old.id } });
        await this.storage.remove(old);
      } catch {
        // Lanjutkan meski gagal hapus avatar lama
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

      // Hapus file avatar hanya setelah user benar-benar terhapus.
      // Hanya avatar hasil upload user ini sendiri (bukan media bersama yang
      // kebetulan dipilih sebagai avatar lewat avatarId).
      if (
        user.avatar &&
        (user.avatar.publicId ?? user.avatar.url).includes(`avatar-${id}-`)
      ) {
        await this.storage.remove(user.avatar);
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
