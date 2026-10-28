import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentStatus, TransactionType } from '@prisma/client';
import { randomInt } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';
import { CreatePaymentDto, QueryPaymentDto } from './dto/payment.dto';

const VALID_HOURS = 24;

/** Field yang aman ditampilkan ke pembayar (tanpa kontak orang lain). */
const PUBLIC_SELECT = {
  id: true,
  baseAmount: true,
  uniqueCode: true,
  totalAmount: true,
  description: true,
  payerName: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  paidAt: true,
  quantity: true,
  productOption: true,
  product: { select: { id: true, name: true } },
} as const;

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /**
   * Pilih kode unik 1..999 sehingga total (dasar + kode) tidak sama dengan
   * pembayaran lain yang masih menunggu, supaya mutasi QRIS bisa dicocokkan.
   */
  async create(dto: CreatePaymentDto, user: AuthenticatedUser | null) {
    if (!(await this.settings.getQris())) {
      throw new ServiceUnavailableException(
        'QRIS Paskatema belum diatur bendahara',
      );
    }
    const order = await this.resolveOrder(dto);
    const now = new Date();
    const taken = await this.prisma.paymentRequest.findMany({
      where: {
        status: PaymentStatus.PENDING,
        expiresAt: { gt: now },
        totalAmount: { gt: order.amount, lt: order.amount + 1000 },
      },
      select: { totalAmount: true },
    });
    const used = new Set(taken.map((t) => t.totalAmount - order.amount));
    const free = Array.from({ length: 999 }, (_, i) => i + 1).filter(
      (c) => !used.has(c),
    );
    if (free.length === 0) {
      throw new ConflictException(
        'Kode unik untuk nominal ini sedang habis. Coba nominal lain.',
      );
    }
    const code = free[randomInt(free.length)];

    return this.prisma.paymentRequest.create({
      data: {
        baseAmount: order.amount,
        uniqueCode: code,
        totalAmount: order.amount + code,
        description: order.description,
        productId: order.productId,
        quantity: order.quantity,
        productOption: order.productOption,
        payerName: dto.payerName,
        payerContact: dto.payerContact || null,
        payerId: user?.id ?? null,
        expiresAt: new Date(now.getTime() + VALID_HOURS * 3600_000),
      },
      select: PUBLIC_SELECT,
    });
  }

  /**
   * Nominal & keterangan pembayaran. Untuk merchandise dihitung di server dari
   * harga produk (nominal dari browser diabaikan) dan stok dicek.
   */
  private async resolveOrder(dto: CreatePaymentDto) {
    if (!dto.productId) {
      if (!dto.amount || !dto.description) {
        throw new BadRequestException(
          'Nominal dan keterangan pembayaran wajib diisi',
        );
      }
      return {
        amount: dto.amount,
        description: dto.description,
        productId: null,
        quantity: null,
        productOption: null,
      };
    }
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException('Produk tidak tersedia');
    }
    const quantity = dto.quantity ?? 1;
    if (product.stock !== null && product.stock < quantity) {
      throw new BadRequestException(
        `Stok tidak cukup (tersisa ${product.stock})`,
      );
    }
    let option: string | null = null;
    if (product.options.length > 0) {
      if (!dto.productOption || !product.options.includes(dto.productOption)) {
        throw new BadRequestException(
          `Pilih salah satu: ${product.options.join(', ')}`,
        );
      }
      option = dto.productOption;
    }
    return {
      amount: product.price * quantity,
      description: `Merchandise: ${product.name}${option ? ` (${option})` : ''} ×${quantity}`,
      productId: product.id,
      quantity,
      productOption: option,
    };
  }

  /** Untuk pembayar: buka lagi halaman pembayarannya lewat id (UUID). */
  async findPublic(id: string) {
    const payment = await this.prisma.paymentRequest.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    return payment;
  }

  /** Untuk bendahara/admin. */
  async findAll(query: QueryPaymentDto) {
    return this.prisma.paymentRequest.findMany({
      where: query.status ? { status: query.status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        product: { select: { id: true, name: true } },
        payer: { select: { id: true, name: true, angkatan: true } },
        confirmedBy: { select: { id: true, name: true } },
      },
    });
  }

  /** Bendahara mengonfirmasi lunas: otomatis dicatat sebagai pemasukan kas. */
  async confirm(id: string, user: AuthenticatedUser) {
    const payment = await this.prisma.paymentRequest.findUnique({
      where: { id },
    });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Pembayaran ini sudah diproses');
    }
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      // Pembelian merchandise: kurangi stok (bila dibatasi).
      if (payment.productId && payment.quantity) {
        const product = await tx.product.findUnique({
          where: { id: payment.productId },
        });
        if (product && product.stock !== null) {
          if (product.stock < payment.quantity) {
            throw new BadRequestException(
              `Stok ${product.name} tinggal ${product.stock}; perbarui stok dulu sebelum konfirmasi`,
            );
          }
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: payment.quantity } },
          });
        }
      }
      const transaction = await tx.transaction.create({
        data: {
          amount: payment.totalAmount,
          date: now,
          type: TransactionType.INCOME,
          description: `QRIS: ${payment.description} — ${payment.payerName} (kode ${payment.uniqueCode})`,
          createdById: user.id,
        },
      });
      return tx.paymentRequest.update({
        where: { id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: now,
          confirmedById: user.id,
          transactionId: transaction.id,
        },
      });
    });
  }

  async cancel(id: string) {
    const payment = await this.prisma.paymentRequest.findUnique({
      where: { id },
    });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Pembayaran ini sudah diproses');
    }
    return this.prisma.paymentRequest.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED },
    });
  }
}
