import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';
import { ForumService } from './forum.service';

describe('ForumService access', () => {
  const userFind = jest.fn();
  const threadFind = jest.fn();
  const threadCreate = jest.fn((args: unknown) => args);
  const tx = jest.fn((ops: unknown[]) => Promise.resolve(ops));
  const prisma = {
    user: { findUnique: userFind },
    forumThread: {
      findUnique: threadFind,
      create: threadCreate,
      update: jest.fn(),
    },
    forumPost: { create: jest.fn(() => ({ id: 'p1' })) },
    $transaction: tx,
  } as unknown as PrismaService;
  const service = new ForumService(prisma);

  const as = (role: Role, angkatan: number | null) => {
    userFind.mockResolvedValue({ angkatan });
    return { id: 'u1', role } as AuthenticatedUser;
  };

  beforeEach(() => jest.clearAllMocks());

  it('menolak anggota yang angkatannya belum diisi', async () => {
    await expect(
      service.createThread({ title: 'Halo', body: 'x' }, as(Role.USER, null)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('anggota boleh menulis di Forum Umum dan forum angkatannya', async () => {
    await service.createThread({ title: 'Umum', body: 'x' }, as(Role.USER, 32));
    await service.createThread(
      { title: 'A32', body: 'x', angkatan: 32 },
      as(Role.USER, 32),
    );
    expect(threadCreate).toHaveBeenCalledTimes(2);
    const calls = threadCreate.mock.calls as unknown as [
      { data: { angkatan: number | null } },
    ][];
    expect(calls.map((c) => c[0].data.angkatan)).toEqual([null, 32]);
  });

  it('anggota tidak bisa membuka forum angkatan lain', async () => {
    threadFind.mockResolvedValue({ id: 't1', angkatan: 31, posts: [] });
    await expect(
      service.findThread('t1', as(Role.USER, 32)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin bisa membuka forum angkatan mana pun', async () => {
    threadFind.mockResolvedValue({ id: 't1', angkatan: 31, posts: [] });
    await expect(
      service.findThread('t1', as(Role.ADMIN, null)),
    ).resolves.toMatchObject({ id: 't1' });
  });

  it('anggota tidak bisa membalas topik yang dikunci', async () => {
    threadFind.mockResolvedValue({ id: 't1', angkatan: null, isLocked: true });
    await expect(
      service.createPost('t1', { body: 'hai' }, as(Role.USER, 32)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('hanya admin yang bisa menyematkan topik', async () => {
    threadFind.mockResolvedValue({ id: 't1', angkatan: null, authorId: 'u1' });
    await expect(
      service.updateThread('t1', { isPinned: true }, as(Role.USER, 32)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
