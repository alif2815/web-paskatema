import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    period: { select: { id: true, name: true } },
    event: { select: { id: true, title: true } },
    createdBy: { select: { id: true, name: true } },
  };

  private async validateRelations(data: {
    periodId?: string;
    eventId?: string;
  }) {
    if (data.periodId) {
      const period = await this.prisma.period.findUnique({
        where: { id: data.periodId },
      });

      if (!period) {
        throw new NotFoundException('Periode tidak ditemukan');
      }
    }

    if (data.eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event) {
        throw new NotFoundException('Event tidak ditemukan');
      }
    }
  }

  private buildWhere(
    query: Pick<
      QueryTransactionDto,
      'type' | 'periodId' | 'eventId' | 'dateFrom' | 'dateTo'
    >,
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.periodId) {
      where.periodId = query.periodId;
    }

    if (query.eventId) {
      where.eventId = query.eventId;
    }

    if (query.dateFrom || query.dateTo) {
      where.date = {
        ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
        ...(query.dateTo && { lte: new Date(query.dateTo) }),
      };
    }

    return where;
  }

  async create(dto: CreateTransactionDto, createdById: string) {
    await this.validateRelations(dto);

    return this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        date: new Date(dto.date),
        type: dto.type,
        description: dto.description,
        periodId: dto.periodId,
        eventId: dto.eventId,
        createdById,
      },
      include: this.includeRelations,
    });
  }

  async findAll(query: QueryTransactionDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: this.includeRelations,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan');
    }

    return transaction;
  }

  async update(id: string, dto: UpdateTransactionDto) {
    await this.findOne(id);
    await this.validateRelations(dto);

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.periodId !== undefined && { periodId: dto.periodId }),
        ...(dto.eventId !== undefined && { eventId: dto.eventId }),
      },
      include: this.includeRelations,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.transaction.delete({ where: { id } });

    return { message: 'Transaksi berhasil dihapus' };
  }

  /**
   * Ringkasan agregat (total pemasukan, pengeluaran, saldo) — endpoint publik
   * untuk transparansi. Sengaja tidak mengembalikan daftar transaksi per baris
   * (detail per transaksi tetap admin-only lewat findAll/findOne).
   */
  async getSummary(
    query: Pick<
      QueryTransactionDto,
      'periodId' | 'eventId' | 'dateFrom' | 'dateTo'
    >,
  ) {
    const where = this.buildWhere(query);

    const grouped = await this.prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    });

    const totalIncome =
      grouped.find((g) => g.type === 'INCOME')?._sum.amount ?? 0;
    const totalExpense =
      grouped.find((g) => g.type === 'EXPENSE')?._sum.amount ?? 0;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }
}
