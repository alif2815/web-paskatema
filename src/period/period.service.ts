import { Injectable } from '@nestjs/common';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PeriodService {
  constructor(private prisma: PrismaService) {}

  async create(createPeriodDto: CreatePeriodDto) {
    return await this.prisma.period.create({
      data: createPeriodDto,
    });
  }

  async findAll() {
    return await this.prisma.period.findMany({
      orderBy: { name: 'desc' } // Mengurutkan dari tahun terbarunyak
    });
  }

  async findOne(id: string) {
    return await this.prisma.period.findUnique({
      where: { id },
    });
  }

  async update(id: string, updatePeriodDto: UpdatePeriodDto) {
    return await this.prisma.period.update({
      where: { id },
      data: updatePeriodDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.period.delete({
      where: { id },
    });
  }
}