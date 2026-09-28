import { BadRequestException } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from './settings.service';

describe('SettingsService active angkatan', () => {
  const findUnique = jest.fn();
  const upsert = jest.fn();
  const updateMany = jest.fn((args: unknown) => args);
  const prisma = {
    appSetting: { findUnique, upsert },
    user: { updateMany },
    $transaction: jest.fn(() => Promise.resolve([{ count: 3 }, { count: 40 }])),
  } as unknown as PrismaService;
  const service = new SettingsService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('pengajuan Aktif harus angkatan aktif, Purna harus di luar daftar', async () => {
    findUnique.mockResolvedValue({ value: [35, 33, 34] });
    await expect(
      service.assertClaimMatchesAngkatan(MemberStatus.AKTIF, 34),
    ).resolves.toBeUndefined();
    await expect(
      service.assertClaimMatchesAngkatan(MemberStatus.AKTIF, 30),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.assertClaimMatchesAngkatan(MemberStatus.PURNA, 33),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.assertClaimMatchesAngkatan(MemberStatus.PURNA, 28),
    ).resolves.toBeUndefined();
  });

  it('tanpa pengaturan tidak memvalidasi', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      service.assertClaimMatchesAngkatan(MemberStatus.AKTIF, 10),
    ).resolves.toBeUndefined();
  });

  it('menerapkan status: angkatan di daftar Aktif, lainnya Purna', async () => {
    const result = await service.updateActiveAngkatan({
      angkatan: [36, 34, 35, 35],
      applyStatus: true,
    });
    expect(result.angkatan).toEqual([34, 35, 36]);
    const [toAktif, toPurna] = updateMany.mock.calls.map((c) => c[0]) as {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }[];
    expect(toAktif).toMatchObject({
      where: { angkatan: { in: [34, 35, 36] } },
      data: { memberStatus: MemberStatus.AKTIF, profilePublic: false },
    });
    expect(toPurna).toMatchObject({
      where: { angkatan: { not: null, notIn: [34, 35, 36] } },
      data: { memberStatus: MemberStatus.PURNA },
    });
    expect(result.message).toContain(
      '3 anggota menjadi Aktif, 40 anggota menjadi Purna',
    );
  });
});
