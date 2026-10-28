import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AuthService } from './auth.service';

describe('AuthService.updateEmail', () => {
  const findUnique = jest.fn();
  const update = jest.fn((args: { data: { email: string } }) => ({
    id: 'u1',
    email: args.data.email,
    name: 'Sari',
    role: Role.USER,
  }));
  const prisma = { user: { findUnique, update } } as unknown as PrismaService;
  const service = new AuthService(
    prisma,
    {} as JwtService,
    {} as SettingsService,
  );

  beforeEach(async () => {
    jest.clearAllMocks();
    const hash = await bcrypt.hash('rahasia123', 4);
    findUnique.mockImplementation(
      ({ where }: { where: { id?: string; email?: string } }) =>
        where.id ? { id: 'u1', role: Role.USER, password: hash } : null,
    );
  });

  it('menolak bila password salah', async () => {
    await expect(
      service.updateEmail('u1', {
        email: 'sari@gmail.com',
        password: 'salah12345',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('mengganti email bila password benar', async () => {
    const result = await service.updateEmail('u1', {
      email: 'sari@gmail.com',
      password: 'rahasia123',
    });
    expect(result.user.email).toBe('sari@gmail.com');
  });
});
