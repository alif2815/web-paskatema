import { TransactionType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { TransactionService } from './transaction.service';

describe('TransactionService line details', () => {
  const create = jest.fn((args: unknown) => args);
  const update = jest.fn((args: unknown) => args);
  const findUnique = jest.fn();
  const prisma = {
    transaction: { create, update, findUnique },
  } as unknown as PrismaService;
  const service = new TransactionService(prisma);

  const base = {
    amount: 1,
    date: '2026-09-25',
    type: TransactionType.EXPENSE,
    description: 'Beli air mineral',
  };

  beforeEach(() => jest.clearAllMocks());

  it('menghitung sub total = jumlah × harga saat create', async () => {
    await service.create(
      {
        ...base,
        quantity: 10,
        unitPrice: 15000,
        unit: ' dus ',
        vendorName: '',
      },
      'user-1',
    );
    const { data } = create.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data).toMatchObject({
      amount: 150000,
      quantity: 10,
      unitPrice: 15000,
      unit: 'dus',
      vendorName: null,
    });
  });

  it('memakai nominal manual jika harga tidak diisi', async () => {
    await service.create({ ...base, amount: 50000, quantity: 2 }, 'user-1');
    const { data } = create.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data.amount).toBe(50000);
  });

  it('menghitung ulang sub total dari data lama saat update sebagian', async () => {
    findUnique.mockResolvedValue({ id: 't1', quantity: 4, unitPrice: 2500 });
    await service.update('t1', { quantity: 6 });
    const { data } = update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data).toMatchObject({ quantity: 6, amount: 15000 });
  });
});
