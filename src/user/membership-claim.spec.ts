import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UserService } from './user.service';

describe('UserService membership claim', () => {
  const findUnique = jest.fn();
  const update = jest.fn((args: unknown) => args);
  const updateMany = jest.fn((args: unknown) => args);
  const prisma = {
    user: { findUnique, update, updateMany },
    $transaction: jest.fn(() => Promise.resolve([{ count: 2 }, { count: 5 }])),
  } as unknown as PrismaService;
  const service = new UserService(prisma, {} as StorageService);

  beforeEach(() => jest.clearAllMocks());

  const dataOf = () =>
    (update.mock.calls[0][0] as { data: Record<string, unknown> }).data;
  const pending = (overrides: Record<string, unknown> = {}) => ({
    id: 'u1',
    angkatan: null,
    claimStatus: MemberStatus.AKTIF,
    claimAngkatan: 32,
    claimAt: new Date(),
    ...overrides,
  });

  it('anggota yang sudah ber-angkatan tidak bisa mengajukan', async () => {
    findUnique.mockResolvedValue({ id: 'u1', angkatan: 30 });
    await expect(
      service.submitMembershipClaim('u1', {
        status: MemberStatus.AKTIF,
        angkatan: 32,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menyetujui pengajuan aktif: angkatan + status Aktif, pengajuan dikosongkan', async () => {
    findUnique.mockResolvedValue(pending());
    await service.reviewMembershipClaim('u1', { approve: true });
    expect(dataOf()).toMatchObject({
      angkatan: 32,
      memberStatus: MemberStatus.AKTIF,
      claimAngkatan: null,
      claimAt: null,
    });
  });

  it('menyetujui pengajuan purna dengan koreksi angkatan', async () => {
    findUnique.mockResolvedValue(pending({ claimStatus: MemberStatus.PURNA }));
    await service.reviewMembershipClaim('u1', { approve: true, angkatan: 24 });
    expect(dataOf()).toMatchObject({
      angkatan: 24,
      memberStatus: MemberStatus.PURNA,
    });
  });

  it('menolak hanya mengosongkan pengajuan', async () => {
    findUnique.mockResolvedValue(pending());
    await service.reviewMembershipClaim('u1', { approve: false });
    expect(dataOf()).not.toHaveProperty('angkatan');
    expect(dataOf()).toMatchObject({ claimAt: null });
  });

  it('404 bila tidak ada pengajuan', async () => {
    findUnique.mockResolvedValue({ id: 'u1', angkatan: null, claimAt: null });
    await expect(
      service.reviewMembershipClaim('u1', { approve: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('setujui satu angkatan: status mengikuti pengajuan masing-masing', async () => {
    const result = await service.approveAngkatanClaims({ angkatan: 32 });
    const [purnaCall, aktifCall] = updateMany.mock.calls.map((c) => c[0]) as {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }[];
    expect(purnaCall.where).toMatchObject({
      claimAngkatan: 32,
      claimStatus: MemberStatus.PURNA,
    });
    expect(purnaCall.data).toMatchObject({ memberStatus: MemberStatus.PURNA });
    expect(aktifCall.data).toMatchObject({
      angkatan: 32,
      memberStatus: MemberStatus.AKTIF,
    });
    expect(result.count).toBe(7);
  });
});
