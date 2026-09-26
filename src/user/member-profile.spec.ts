import { BadRequestException } from '@nestjs/common';
import { MemberStatus, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';
import { UserService } from './user.service';

describe('UserService member profile', () => {
  const findFirst = jest.fn();
  const findUnique = jest.fn();
  const update = jest.fn((args: unknown) => args);
  const prisma = {
    user: { findFirst, findUnique, update },
  } as unknown as PrismaService;
  const service = new UserService(prisma, {} as StorageService);

  const member = (overrides: Record<string, unknown> = {}) => ({
    id: 'm1',
    name: 'Sari',
    angkatan: 30,
    memberStatus: MemberStatus.AKTIF,
    bio: 'bio',
    education: 'UB',
    occupation: null,
    skills: ['PBB'],
    linkedinUrl: null,
    instagram: null,
    profilePublic: false,
    avatar: null,
    structures: [],
    ...overrides,
  });
  const viewer = (role: Role) => ({ id: 'v1', role }) as AuthenticatedUser;

  beforeEach(() => jest.clearAllMocks());

  it('pengunjung tanpa login hanya melihat data dasar', async () => {
    findFirst.mockResolvedValue(member());
    const profile = await service.findMemberProfile('m1', null);
    expect(profile.detailsVisible).toBe(false);
    expect(profile).not.toHaveProperty('education');
  });

  it('anggota ber-angkatan melihat profil lengkap', async () => {
    findFirst.mockResolvedValue(member());
    findUnique.mockResolvedValue({ angkatan: 31 });
    const profile = await service.findMemberProfile('m1', viewer(Role.USER));
    expect(profile).toMatchObject({ detailsVisible: true, education: 'UB' });
  });

  it('akun tanpa angkatan tidak melihat detail', async () => {
    findFirst.mockResolvedValue(member());
    findUnique.mockResolvedValue({ angkatan: null });
    const profile = await service.findMemberProfile('m1', viewer(Role.USER));
    expect(profile.detailsVisible).toBe(false);
  });

  it('purna dengan profil publik terlihat tanpa login', async () => {
    findFirst.mockResolvedValue(
      member({ memberStatus: MemberStatus.PURNA, profilePublic: true }),
    );
    const profile = await service.findMemberProfile('m1', null);
    expect(profile.detailsVisible).toBe(true);
  });

  it('anggota aktif tidak bisa membuat profil publik', async () => {
    findUnique.mockResolvedValue({
      id: 'm1',
      memberStatus: MemberStatus.AKTIF,
    });
    await expect(
      service.updateProfile('m1', { profilePublic: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menormalkan instagram, keahlian, dan teks kosong', async () => {
    findUnique.mockResolvedValue({
      id: 'm1',
      memberStatus: MemberStatus.PURNA,
    });
    await service.updateProfile('m1', {
      instagram: '@sari.pk',
      skills: [' PBB ', 'PBB', '', 'Desain'],
      education: '  ',
    });
    const { data } = update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data).toMatchObject({
      instagram: 'sari.pk',
      skills: ['PBB', 'Desain'],
      education: null,
    });
  });
});
