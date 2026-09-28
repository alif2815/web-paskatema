import { PrismaClient, Role } from '@prisma/client';

import { syncTreasurerRoles } from './treasurer-role';

describe('syncTreasurerRoles', () => {
  const findMany = jest.fn();
  const updateMany = jest.fn((args: unknown) => args);
  const prisma = {
    structure: { findMany },
    user: { updateMany },
    $transaction: jest.fn((ops: unknown[]) =>
      Promise.resolve(ops.map(() => ({ count: 0 }))),
    ),
  } as unknown as PrismaClient;

  it('memberi role bendahara ke pemegang jabatan dan mencabut dari yang lain', async () => {
    findMany.mockResolvedValue([
      { userId: 'a' },
      { userId: 'a' },
      { userId: 'b' },
    ]);
    await syncTreasurerRoles(prisma);

    const [promote, demote] = updateMany.mock.calls.map((c) => c[0]) as {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }[];
    // Hanya USER yang dinaikkan (ADMIN tidak disentuh).
    expect(promote).toEqual({
      where: { id: { in: ['a', 'b'] }, role: Role.USER },
      data: { role: Role.BENDAHARA },
    });
    expect(demote).toEqual({
      where: { role: Role.BENDAHARA, id: { notIn: ['a', 'b'] } },
      data: { role: Role.USER },
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          period: { isActive: true },
          position: { name: { contains: 'bendahara', mode: 'insensitive' } },
        },
      }),
    );
  });
});
