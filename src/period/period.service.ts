import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { QueryPeriodDto } from './dto/query-period.dto';

@Injectable()
export class PeriodService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(createPeriodDto: CreatePeriodDto) {
    const { name, isActive = false } = createPeriodDto;

    return this.prisma.$transaction(async (tx) => {
      // kalau periode baru langsung aktif,
      // nonaktifkan periode aktif sebelumnya.
      if (isActive) {
        await tx.period.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return tx.period.create({
        data: { name, isActive },
      });
    });
  }

  async findAll(query?: QueryPeriodDto) {
    return this.prisma.period.findMany({
      where: {
        ...(query?.isActive !== undefined && { isActive: query.isActive }),
      },
      orderBy: { name: 'desc' },
    });
  }

  async findActive() {
    return this.prisma.period.findFirst({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const period = await this.prisma.period.findUnique({
      where: { id },
    });

    if (!period) {
      throw new NotFoundException('Periode tidak ditemukan');
    }

    return period;
  }

  async update(id: string, updatePeriodDto: UpdatePeriodDto) {
    const existingPeriod = await this.prisma.period.findUnique({
      where: { id },
    });

    if (!existingPeriod) {
      throw new NotFoundException('Periode tidak ditemukan');
    }

    const { name, isActive } = updatePeriodDto;

    return this.prisma.$transaction(async (tx) => {
      if (isActive === true) {
        await tx.period.updateMany({
          where: {
            isActive: true,
            id: { not: id },
          },
          data: { isActive: false },
        });
      }

      return tx.period.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(isActive !== undefined && { isActive }),
        },
      });
    });
  }

  async remove(id: string) {
    const existingPeriod = await this.prisma.period.findUnique({
      where: { id },
    });

    if (!existingPeriod) {
      throw new NotFoundException('Periode tidak ditemukan');
    }

    return this.prisma.period.delete({
      where: { id },
    });
  }
}