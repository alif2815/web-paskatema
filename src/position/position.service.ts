import { Injectable } from '@nestjs/common';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PrismaService } from '../prisma/prisma.service'; 

@Injectable()
export class PositionService {
  constructor(private prisma: PrismaService) {}

  async create(createPositionDto: CreatePositionDto) {
    return await this.prisma.position.create({
      data: createPositionDto,
    });
  }

  async findAll() {
    return await this.prisma.position.findMany({
      orderBy: { level: 'asc' }
    });
  }

  async findOne(id: string) {
    return await this.prisma.position.findUnique({
      where: { id },
    });
  }

  async update(id: string, updatePositionDto: UpdatePositionDto) {
    return await this.prisma.position.update({
      where: { id },
      data: updatePositionDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.position.delete({
      where: { id },
    });
  }
}