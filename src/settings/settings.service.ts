import { BadRequestException, Injectable } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateActiveAngkatanDto } from './dto/active-angkatan.dto';
import { UpdateQrisDto } from './dto/qris.dto';
import { validateQris } from './qris';

const ACTIVE_ANGKATAN = 'active_angkatan';
const QRIS = 'qris';

export interface QrisSetting {
  /** Payload QRIS statis (EMVCo), sumber QRIS dinamis di frontend. */
  payload: string;
  merchantName: string;
  note: string | null;
}

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

  /** QRIS Paskatema untuk donasi/pembayaran; null bila belum diatur. */
  async getQris(): Promise<QrisSetting | null> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key: QRIS },
    });
    const value = row?.value as Partial<QrisSetting> | null | undefined;
    return value?.payload ? (value as QrisSetting) : null;
  }

  /** Bendahara/admin mengganti atau menghapus QRIS (payload kosong = hapus). */
  async updateQris(dto: UpdateQrisDto): Promise<QrisSetting | null> {
    if (!dto.payload) {
      await this.prisma.appSetting.deleteMany({ where: { key: QRIS } });
      return null;
    }
    let merchantName: string;
    try {
      ({ merchantName } = validateQris(dto.payload));
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    const value: QrisSetting = {
      payload: dto.payload,
      merchantName,
      note: dto.note || null,
    };
    await this.prisma.appSetting.upsert({
      where: { key: QRIS },
      update: { value: { ...value } },
      create: { key: QRIS, value: { ...value } },
    });
    return value;
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
