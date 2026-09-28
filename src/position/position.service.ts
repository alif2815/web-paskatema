import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { syncTreasurerRoles } from '../auth/treasurer-role';

@Injectable()
export class PositionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPositionDto: CreatePositionDto) {
    return this.prisma.position.create({
      data: {
        name: createPositionDto.name,
        level: createPositionDto.level,
      },
    });
  }

  async findAll() {
    return this.prisma.position.findMany({
      orderBy: {
        level: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const position = await this.prisma.position.findUnique({
      where: {
        id,
      },
    });

    if (!position) {
      throw new NotFoundException('Jabatan tidak ditemukan');
    }

    return position;
  }

  async update(id: string, updatePositionDto: UpdatePositionDto) {
    const existingPosition = await this.prisma.position.findUnique({
      where: {
        id,
      },
    });

    if (!existingPosition) {
      throw new NotFoundException('Jabatan tidak ditemukan');
    }

    const { name, level } = updatePositionDto;

    const result = await this.prisma.position.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(level !== undefined && { level }),
      },
    });
    await syncTreasurerRoles(this.prisma);
    return result;
  }

  async remove(id: string) {
    const existingPosition = await this.prisma.position.findUnique({
      where: {
        id,
      },
    });

    if (!existingPosition) {
      throw new NotFoundException('Jabatan tidak ditemukan');
    }

    const used = await this.prisma.structure.count({
      where: { positionId: id },
    });
    if (used > 0) {
      throw new ConflictException(
        `Jabatan ini masih dipakai ${used} penempatan di Struktur. Pindahkan atau hapus penempatannya dulu.`,
      );
    }

    const result = await this.prisma.position.delete({
      where: {
        id,
      },
    });
    await syncTreasurerRoles(this.prisma);
    return result;
  }
}
