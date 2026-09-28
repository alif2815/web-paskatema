import { BadRequestException, Injectable } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateActiveAngkatanDto } from './dto/active-angkatan.dto';

const ACTIVE_ANGKATAN = 'active_angkatan';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Angkatan yang masih anggota aktif (urut naik). Kosong = belum diatur. */
  async getActiveAngkatan(): Promise<number[]> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key: ACTIVE_ANGKATAN },
    });
    const value = row?.value;
    return Array.isArray(value)
      ? value
          .filter((n): n is number => typeof n === 'number')
          .sort((a, b) => a - b)
      : [];
  }

  async updateActiveAngkatan(dto: UpdateActiveAngkatanDto) {
    const angkatan = [...new Set(dto.angkatan)].sort((a, b) => a - b);
    await this.prisma.appSetting.upsert({
      where: { key: ACTIVE_ANGKATAN },
      update: { value: angkatan },
      create: { key: ACTIVE_ANGKATAN, value: angkatan },
    });

    let aktif = 0;
    let purna = 0;
    if (dto.applyStatus) {
      const [toAktif, toPurna] = await this.prisma.$transaction([
        this.prisma.user.updateMany({
          where: {
            angkatan: { in: angkatan },
            memberStatus: MemberStatus.PURNA,
          },
          // Profil publik hanya untuk Purna.
          data: { memberStatus: MemberStatus.AKTIF, profilePublic: false },
        }),
        this.prisma.user.updateMany({
          where: {
            angkatan: { not: null, notIn: angkatan },
            memberStatus: MemberStatus.AKTIF,
          },
          data: { memberStatus: MemberStatus.PURNA },
        }),
      ]);
      aktif = toAktif.count;
      purna = toPurna.count;
    }

    return {
      angkatan,
      message: dto.applyStatus
        ? `Angkatan aktif disimpan. ${aktif} anggota menjadi Aktif, ${purna} anggota menjadi Purna.`
        : 'Angkatan aktif disimpan.',
    };
  }

  /**
   * Pengajuan keanggotaan harus cocok dengan angkatan aktif: Aktif hanya
   * untuk angkatan di daftar, Purna hanya untuk angkatan di luar daftar.
   * Tidak diperiksa bila daftar belum diatur.
   */
  async assertClaimMatchesAngkatan(status: MemberStatus, angkatan: number) {
    const active = await this.getActiveAngkatan();
    if (active.length === 0) return;
    const isActive = active.includes(angkatan);
    if (status === MemberStatus.AKTIF && !isActive) {
      throw new BadRequestException(
        `Angkatan aktif saat ini: ${active.join(', ')}. Angkatan ${angkatan} terdaftar sebagai purna — pilih "Purna".`,
      );
    }
    if (status === MemberStatus.PURNA && isActive) {
      throw new BadRequestException(
        `Angkatan ${angkatan} masih anggota aktif — pilih "Anggota aktif".`,
      );
    }
  }
}
