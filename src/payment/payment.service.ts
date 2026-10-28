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
    const now = new Date();
    const taken = await this.prisma.paymentRequest.findMany({
      where: {
        status: PaymentStatus.PENDING,
        expiresAt: { gt: now },
        totalAmount: { gt: dto.amount, lt: dto.amount + 1000 },
      },
      select: { totalAmount: true },
    });
    const used = new Set(taken.map((t) => t.totalAmount - dto.amount));
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
        baseAmount: dto.amount,
        uniqueCode: code,
        totalAmount: dto.amount + code,
        description: dto.description,
        payerName: dto.payerName,
        payerContact: dto.payerContact || null,
        payerId: user?.id ?? null,
        expiresAt: new Date(now.getTime() + VALID_HOURS * 3600_000),
      },
      select: PUBLIC_SELECT,
    });
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
