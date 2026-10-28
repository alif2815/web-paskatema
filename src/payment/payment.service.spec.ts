import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentStatus, TransactionType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  const findMany = jest.fn();
  const create = jest.fn(
    (args: { data: Record<string, unknown> }) => args.data,
  );
  const findUnique = jest.fn();
  const txCreate = jest.fn(() => ({ id: 'trx1' }));
  const txUpdate = jest.fn((args: unknown) => args);
  const productFind = jest.fn();
  const productUpdate = jest.fn();
  const prisma = {
    paymentRequest: { findMany, create, findUnique, update: jest.fn() },
    product: { findUnique: productFind },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      fn({
        transaction: { create: txCreate },
        paymentRequest: { update: txUpdate },
        product: { findUnique: productFind, update: productUpdate },
      }),
    ),
  } as unknown as PrismaService;
  const getQris = jest.fn();
  const service = new PaymentService(prisma, {
    getQris,
  } as unknown as SettingsService);
  const dto = {
    amount: 50000,
    description: 'Iuran Oktober',
    payerName: 'Sari',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getQris.mockResolvedValue({ payload: 'x' });
  });

  it('menolak bila QRIS belum diatur', async () => {
    getQris.mockResolvedValue(null);
    await expect(service.create(dto, null)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('memberi kode unik 1..999 yang belum dipakai pembayaran lain', async () => {
    // Semua kode kecuali 777 sudah dipakai.
    findMany.mockResolvedValue(
      Array.from({ length: 999 }, (_, i) => i + 1)
        .filter((c) => c !== 777)
        .map((c) => ({ totalAmount: 50000 + c })),
    );
    const result = (await service.create(dto, null)) as unknown as Record<
      string,
      number
    >;
    expect(result.uniqueCode).toBe(777);
    expect(result.totalAmount).toBe(50777);
  });

  it('konfirmasi lunas otomatis mencatat pemasukan sebesar total', async () => {
    findUnique.mockResolvedValue({
      id: 'p1',
      status: PaymentStatus.PENDING,
      totalAmount: 50123,
      uniqueCode: 123,
      description: 'Iuran Oktober',
      payerName: 'Sari',
    });
    await service.confirm('p1', { id: 'b1' } as AuthenticatedUser);
    expect(txCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 50123,
        type: TransactionType.INCOME,
        createdById: 'b1',
      }) as unknown,
    });
    expect(txUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PaymentStatus.PAID,
          transactionId: 'trx1',
        }) as unknown,
      }),
    );
  });

  it('tidak bisa dikonfirmasi dua kali', async () => {
    findUnique.mockResolvedValue({ id: 'p1', status: PaymentStatus.PAID });
    await expect(
      service.confirm('p1', { id: 'b1' } as AuthenticatedUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('merchandise', () => {
    const kaos = {
      id: 'k1',
      name: 'Kaos Paskatema',
      price: 85000,
      stock: 3,
      options: ['M', 'L'],
      isActive: true,
    };
    const buyer = {
      payerName: 'Sari',
      productId: 'k1',
      quantity: 2,
      productOption: 'L',
    };

    it('harga dihitung di server dari produk (nominal dari browser diabaikan)', async () => {
      productFind.mockResolvedValue(kaos);
      findMany.mockResolvedValue([]);
      const result = (await service.create(
        { ...buyer, amount: 1000 },
        null,
      )) as unknown as Record<string, unknown>;
      expect(result.baseAmount).toBe(170000);
      expect(result.description).toBe('Merchandise: Kaos Paskatema (L) ×2');
    });

    it('menolak bila stok kurang atau pilihan tidak valid', async () => {
      productFind.mockResolvedValue(kaos);
      await expect(
        service.create({ ...buyer, quantity: 5 }, null),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.create({ ...buyer, productOption: 'XXL' }, null),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('konfirmasi lunas mengurangi stok', async () => {
      findUnique.mockResolvedValue({
        id: 'p2',
        status: PaymentStatus.PENDING,
        totalAmount: 170045,
        uniqueCode: 45,
        description: 'Merchandise: Kaos Paskatema (L) ×2',
        payerName: 'Sari',
        productId: 'k1',
        quantity: 2,
      });
      productFind.mockResolvedValue(kaos);
      await service.confirm('p2', { id: 'b1' } as AuthenticatedUser);
      expect(productUpdate).toHaveBeenCalledWith({
        where: { id: 'k1' },
        data: { stock: { decrement: 2 } },
      });
    });
  });

  it('donasi boleh tanpa nama (Anonim) dan dicatat dengan jenis DONASI', async () => {
    findMany.mockResolvedValue([]);
    const result = (await service.create(
      { kind: 'DONASI', amount: 25000 },
      null,
    )) as unknown as Record<string, unknown>;
    expect(result).toMatchObject({
      kind: 'DONASI',
      payerName: 'Anonim',
      description: 'Donasi',
      baseAmount: 25000,
    });
  });

  it('pembayaran tetap wajib nama', async () => {
    await expect(
      service.create({ amount: 25000, description: 'Iuran' }, null),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
