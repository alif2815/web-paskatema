import { ForbiddenException } from '@nestjs/common';
import { MemberStatus, OpportunityType, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';
import { NetworkService } from './network.service';

describe('NetworkService access', () => {
  const findUnique = jest.fn();
  const create = jest.fn((args: unknown) => args);
  const oppFind = jest.fn();
  const prisma = {
    user: { findUnique, findMany: jest.fn(), count: jest.fn() },
    opportunity: {
      create,
      findUnique: oppFind,
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(() => Promise.resolve([[], 0])),
  } as unknown as PrismaService;
  const service = new NetworkService(prisma);

  const as = (
    role: Role,
    angkatan: number | null,
    status = MemberStatus.AKTIF,
  ) => {
    findUnique.mockResolvedValue({ angkatan, memberStatus: status });
    return { id: 'u1', role } as AuthenticatedUser;
  };
  const opportunity = {
    title: 'Magang',
    organization: 'PT X',
    type: OpportunityType.MAGANG,
    description: 'Deskripsi magang yang cukup panjang',
  };

  beforeEach(() => jest.clearAllMocks());

  it('akun tanpa angkatan tidak bisa membuka jaringan', async () => {
    await expect(
      service.findMembers({}, as(Role.USER, null)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('anggota aktif bisa membaca tetapi tidak membagikan peluang', async () => {
    await expect(
      service.findOpportunities({}, as(Role.USER, 34)),
    ).resolves.toBeDefined();
    await expect(
      service.createOpportunity(opportunity, as(Role.USER, 34)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('purna dan admin bisa membagikan peluang', async () => {
    await service.createOpportunity(
      opportunity,
      as(Role.USER, 25, MemberStatus.PURNA),
    );
    await service.createOpportunity(opportunity, as(Role.ADMIN, null));
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('hanya penulis atau admin yang bisa menghapus', async () => {
    oppFind.mockResolvedValue({ id: 'o1', authorId: 'someone-else' });
    await expect(
      service.removeOpportunity('o1', as(Role.USER, 25, MemberStatus.PURNA)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.removeOpportunity('o1', as(Role.ADMIN, null)),
    ).resolves.toBeDefined();
  });
});
