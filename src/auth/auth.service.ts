import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthDto } from './dto/register.dto';
import { LoginAuthDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // =====================
  // REGISTER
  // =====================
  async register(dto: CreateAuthDto) {
    // Cek apakah email sudah digunakan
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
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
        role: dto.role,
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

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);

    if (!isOldPasswordValid) {
      throw new BadRequestException('Password lama tidak sesuai');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password berhasil diubah' };
  }

  // =====================
  // UPDATE EMAIL
  // =====================
  async updateEmail(userId: string, dto: UpdateEmailDto) {
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
  private async signToken(userId: string, email: string, role: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwt.signAsync(payload);
  }
}
