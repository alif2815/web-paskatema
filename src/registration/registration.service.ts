import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusReg } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';

@Injectable()
export class RegistrationService {
  constructor(private readonly prisma: PrismaService) { }

  // ─────────────────────────────────────────────────────────────
  // USER: Daftar ke Event/Oprec  
  // ─────────────────────────────────────────────────────────────

  /**
   * User mendaftar ke suatu Event/Oprec.
   * Validasi:
   *  - FormSetting harus ada & isActive = true
   *  - User belum pernah mendaftar ke form yang sama
   */
  async register(userId: string, dto: CreateRegistrationDto) {
    // 1. Cek FormSetting ada & aktif
    const form = await this.prisma.formSetting.findUnique({
      where: { id: dto.formId },
    });

    if (!form) {
      throw new NotFoundException(`Form pendaftaran tidak ditemukan`);
    }

    if (!form.isActive) {
      throw new BadRequestException(
        `Pendaftaran untuk form ini sedang tidak dibuka`,
      );
    }

    // 2. Cegah double-registration
    const existing = await this.prisma.registration.findFirst({
      where: { userId, formId: dto.formId },
    });

    if (existing) {
      throw new ConflictException(
        `Anda sudah mendaftar pada form pendaftaran ini`,
      );
    }

    // 3. Simpan pendaftaran
    return this.prisma.registration.create({
      data: {
        userId,
        formId: dto.formId,
        answers: dto.answers as unknown as Prisma.InputJsonValue,
        status: StatusReg.PENDING,
      },
      include: {
        form: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // USER: Lihat riwayat pendaftaran milik sendiri
  // ─────────────────────────────────────────────────────────────

  async findMyRegistrations(userId: string) {
    return this.prisma.registration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        form: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * User melihat detail pendaftaran miliknya.
   * Tidak boleh melihat milik orang lain.
   */
  async findMyRegistrationById(userId: string, id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        form: { select: { id: true, title: true, schema: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!registration) {
      throw new NotFoundException(`Pendaftaran tidak ditemukan`);
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException(
        `Anda tidak berhak mengakses pendaftaran ini`,
      );
    }

    return registration;
  }

  // ─────────────────────────────────────────────────────────────
  // ADMIN: Kelola semua pendaftaran
  // ─────────────────────────────────────────────────────────────

  /**
   * Admin melihat semua pendaftaran.
   * Bisa difilter berdasarkan formId atau status.
   */
  async findAll(filters?: { formId?: string; status?: StatusReg }) {
    return this.prisma.registration.findMany({
      where: {
        ...(filters?.formId && { formId: filters.formId }),
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        form: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /** Admin melihat detail satu pendaftaran */
  async findOne(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        form: { select: { id: true, title: true, schema: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!registration) {
      throw new NotFoundException(`Pendaftaran dengan id "${id}" tidak ditemukan`);
    }

    return registration;
  }

  /**
   * Admin mengubah status pendaftaran: ACCEPTED atau REJECTED.
   */
  async updateStatus(id: string, dto: UpdateRegistrationDto) {
    // Pastikan pendaftaran ada
    await this.findOne(id);

    return this.prisma.registration.update({
      where: { id },
      data: { status: dto.status },
      include: {
        form: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Admin menghapus pendaftaran (misal: data spam / error input).
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.registration.delete({ where: { id } });

    return { message: `Pendaftaran berhasil dihapus` };
  }
}
