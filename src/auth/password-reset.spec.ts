import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';

describe('AuthService password reset', () => {
  const userFind = jest.fn();
  const tokenFind = jest.fn();
  const tokenCreate = jest.fn((args: unknown) => args);
  const send = jest.fn(() => Promise.resolve(true));
  const prisma = {
    user: { findFirst: userFind, update: jest.fn((a: unknown) => a) },
    passwordResetToken: {
      findUnique: tokenFind,
      create: tokenCreate,
      deleteMany: jest.fn((a: unknown) => a),
      update: jest.fn((a: unknown) => a),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  } as unknown as PrismaService;
  const service = new AuthService(
    prisma,
    {} as JwtService,
    {} as SettingsService,
    { send } as unknown as MailService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('respons sama untuk email terdaftar maupun tidak, dan tidak mengirim email ke yang tidak terdaftar', async () => {
    userFind.mockResolvedValue(null);
    const unknown = await service.forgotPassword({ email: 'x@y.com' });
    expect(send).not.toHaveBeenCalled();

    userFind.mockResolvedValue({
      id: 'u1',
      name: 'Sari',
      email: 'sari@gmail.com',
    });
    const known = await service.forgotPassword({ email: 'SARI@gmail.com' });
    expect(known).toEqual(unknown);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('yang disimpan hanya hash token, dan link berisi token asli', async () => {
    userFind.mockResolvedValue({
      id: 'u1',
      name: 'Sari',
      email: 'sari@gmail.com',
    });
    await service.forgotPassword({ email: 'sari@gmail.com' });
    const calls = send.mock.calls as unknown as [string, string, string][];
    const token = /token=([a-f0-9]{64})/.exec(calls[0][2])?.[1] ?? '';
    const stored = (
      tokenCreate.mock.calls[0][0] as { data: { tokenHash: string } }
    ).data.tokenHash;
    expect(stored).toBe(createHash('sha256').update(token).digest('hex'));
    expect(stored).not.toBe(token);
  });

  it('menolak token yang kedaluwarsa atau sudah dipakai', async () => {
    const dto = {
      token: 'a'.repeat(64),
      newPassword: 'Baru12345',
      confirmNewPassword: 'Baru12345',
    };
    tokenFind.mockResolvedValue({
      id: 't',
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    tokenFind.mockResolvedValue({
      id: 't',
      userId: 'u1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('token valid: password diganti dan passwordChangedAt diisi', async () => {
    tokenFind.mockResolvedValue({
      id: 't',
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await service.resetPassword({
      token: 'a'.repeat(64),
      newPassword: 'Baru12345',
      confirmNewPassword: 'Baru12345',
    });
    const calls = (prisma.$transaction as jest.Mock).mock.calls as unknown as [
      { data: Record<string, unknown> }[],
    ][];
    const ops = calls[0][0];
    expect(ops[0].data.passwordChangedAt).toBeInstanceOf(Date);
    expect(ops[1].data.usedAt).toBeInstanceOf(Date);
  });
});
