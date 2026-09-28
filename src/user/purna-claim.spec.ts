import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UserService } from './user.service';

describe('UserService purna claim', () => {
  const findUnique = jest.fn();
  const update = jest.fn((args: unknown) => args);
  const prisma = { user: { findUnique, update } } as unknown as PrismaService;
  const service = new UserService(prisma, {} as StorageService);

  beforeEach(() => jest.clearAllMocks());

  const dataOf = () =>
    (update.mock.calls[0][0] as { data: Record<string, unknown> }).data;

  it('anggota yang sudah ber-angkatan tidak bisa mengajukan klaim', async () => {
    findUnique.mockResolvedValue({ id: 'u1', angkatan: 30 });
    await expect(
      service.submitPurnaClaim('u1', { angkatan: 25 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menyetujui klaim: angkatan diklaim + status Purna, klaim dikosongkan', async () => {
    findUnique.mockResolvedValue({
      id: 'u1',
      angkatan: null,
      purnaClaimAngkatan: 25,
      purnaClaimAt: new Date(),
    });
    await service.reviewPurnaClaim('u1', { approve: true });
    expect(dataOf()).toMatchObject({
      angkatan: 25,
      memberStatus: MemberStatus.PURNA,
      purnaClaimAngkatan: null,
      purnaClaimAt: null,
    });
  });

  it('admin bisa mengoreksi angkatan saat menyetujui', async () => {
    findUnique.mockResolvedValue({
      id: 'u1',
      angkatan: null,
      purnaClaimAngkatan: 25,
      purnaClaimAt: new Date(),
    });
    await service.reviewPurnaClaim('u1', { approve: true, angkatan: 24 });
    expect(dataOf()).toMatchObject({ angkatan: 24 });
  });

  it('menolak klaim hanya mengosongkan klaim', async () => {
    findUnique.mockResolvedValue({
      id: 'u1',
      angkatan: null,
      purnaClaimAngkatan: 25,
      purnaClaimAt: new Date(),
    });
    await service.reviewPurnaClaim('u1', { approve: false });
    expect(dataOf()).not.toHaveProperty('angkatan');
    expect(dataOf()).toMatchObject({ purnaClaimAt: null });
  });

  it('404 bila tidak ada klaim', async () => {
    findUnique.mockResolvedValue({
      id: 'u1',
      angkatan: null,
      purnaClaimAt: null,
    });
    await expect(
      service.reviewPurnaClaim('u1', { approve: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
