import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthDto } from './dto/register.dto';
import { LoginAuthDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { SettingsService } from '../settings/settings.service';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';

/** Domain email yang wajib digunakan oleh akun ADMIN */
const ADMIN_EMAIL_DOMAIN = '@paskatema.com';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly settings: SettingsService,
    private readonly mail: MailService,
  ) {}

  // =====================
  // REGISTER
  // =====================
  async register(dto: CreateAuthDto) {
    // Registrasi publik SELALU membuat akun dengan role USER — tidak ada
    // jalur apa pun (input client, domain email, dsb.) yang bisa membuat
    // akun ADMIN lewat endpoint ini. Aplikasi ini hanya punya satu akun
    // ADMIN, dan itu dibuat lewat `prisma/seed.ts` (operator-only, lihat
    // file tersebut), bukan lewat self-registration.
    const role: Role = Role.USER;

    // Cek apakah email sudah digunakan
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    if (dto.membership) {
      await this.settings.assertClaimMatchesAngkatan(
        dto.membership.status,
        dto.membership.angkatan,
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Buat user baru
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
        bio: dto.bio,
        role,
        // Anggota aktif/purna yang sudah ada: pengajuan disimpan, angkatan &
        // status tetap menunggu verifikasi admin.
        ...(dto.membership && {
          claimStatus: dto.membership.status,
          claimAngkatan: dto.membership.angkatan,
          claimGraduationYear: dto.membership.graduationYear,
          claimNote: dto.membership.note || null,
          claimAt: new Date(),
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        bio: true,
        createdAt: true,
      },
    });

    return {
      message: 'Registrasi berhasil',
      user,
    };
  }

  // =====================
  // LOGIN
  // =====================
  async login(dto: LoginAuthDto) {
    // Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Generate JWT token
    const token = await this.signToken(user.id, user.email, user.role);

    return {
      message: 'Login berhasil',
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
      },
    };
  }

  // =====================
  // GET PROFILE (me)
  // =====================
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        bio: true,
        angkatan: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // =====================
  // CHANGE PASSWORD
  // =====================
  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Konfirmasi password baru tidak cocok');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Password lama tidak sesuai');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    // Login di perangkat lain otomatis keluar; perangkat ini diberi token baru.
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword, passwordChangedAt: new Date() },
    });

    return {
      message: 'Password berhasil diubah',
      access_token: await this.signToken(user.id, user.email, user.role),
    };
  }

  // =====================
  // UPDATE EMAIL
  // =====================
  async updateEmail(userId: string, dto: UpdateEmailDto) {
    // Ambil data user saat ini untuk mengetahui role-nya
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    // Wajib password saat ini: perangkat yang tertinggal dalam keadaan login
    // tidak boleh bisa mengambil alih akun dengan mengganti email.
    if (!(await bcrypt.compare(dto.password, currentUser.password))) {
      throw new BadRequestException('Password tidak sesuai');
    }

    // Validasi domain email berdasarkan role
    if (currentUser.role === Role.ADMIN) {
      if (!dto.email.endsWith(ADMIN_EMAIL_DOMAIN)) {
        throw new ForbiddenException(
          `Akun admin hanya dapat menggunakan email berformat *${ADMIN_EMAIL_DOMAIN}`,
        );
      }
    } else {
      if (dto.email.endsWith(ADMIN_EMAIL_DOMAIN)) {
        throw new ForbiddenException(
          `Email dengan domain ${ADMIN_EMAIL_DOMAIN} hanya dapat digunakan oleh ADMIN`,
        );
      }
    }

    // Cek apakah email baru sudah digunakan user lain
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Email sudah digunakan oleh akun lain');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return {
      message: 'Email berhasil diperbarui',
      user: updated,
    };
  }

  // =====================
  // Helper: Sign JWT
  // =====================
  private async signToken(
    userId: string,
    email: string,
    role: string,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwt.signAsync(payload);
  }

  // =====================
  // LUPA PASSWORD
  // =====================
  private static readonly RESET_TTL_MS = 60 * 60 * 1000; // 1 jam

  private static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Kirim link reset ke email yang tercatat. Respons selalu sama, terdaftar
   * atau tidak, supaya endpoint ini tidak bisa dipakai menebak email anggota.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const generic = {
      message:
        'Jika email tersebut terdaftar, link untuk mengganti password sudah dikirim. Periksa juga folder Spam.',
    };
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
      select: { id: true, name: true, email: true },
    });
    if (!user) return generic;

    const token = randomBytes(32).toString('hex');
    await this.prisma.$transaction([
      // Link lama yang belum dipakai tidak berlaku lagi.
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: AuthService.hashToken(token),
          expiresAt: new Date(Date.now() + AuthService.RESET_TTL_MS),
        },
      }),
    ]);

    const appUrl = (
      process.env.APP_URL || 'https://paskatema.smktelkom-mlg.sch.id'
    ).replace(/\/$/, '');
    const link = `${appUrl}/reset-password?token=${token}`;
    await this.mail.send(
      user.email,
      'Ganti password akun Paskatema',
      `Halo ${user.name},\n\nKami menerima permintaan untuk mengganti password akun Paskatema Anda. Buka link berikut (berlaku 1 jam, hanya sekali pakai):\n\n${link}\n\nAbaikan email ini bila Anda tidak memintanya; password Anda tidak berubah.\n\nPaskatema SMK Telkom Malang`,
      `<p>Halo ${escapeHtml(user.name)},</p>
<p>Kami menerima permintaan untuk mengganti password akun Paskatema Anda.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#e11d48;color:#fff;border-radius:999px;text-decoration:none;font-weight:600">Ganti password</a></p>
<p style="color:#64748b;font-size:13px">Link berlaku 1 jam dan hanya bisa dipakai sekali. Abaikan email ini bila Anda tidak memintanya; password Anda tidak berubah.</p>
<p>Paskatema SMK Telkom Malang</p>`,
    );
    return generic;
  }

  /** Ganti password dengan token dari email; semua login lama ikut keluar. */
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Konfirmasi password baru tidak cocok');
    }
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: AuthService.hashToken(dto.token) },
    });
    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Link ganti password tidak valid atau sudah kedaluwarsa. Minta link baru.',
      );
    }
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          password: await bcrypt.hash(dto.newPassword, 10),
          passwordChangedAt: now,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
    ]);
    return {
      message: 'Password berhasil diganti. Silakan masuk dengan password baru.',
    };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
