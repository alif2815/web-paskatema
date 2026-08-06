import { Injectable } from '@nestjs/common';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { PrismaService } from '../prisma/prisma.service'; // Pastikan path import ini sesuai

@Injectable()
export class StructureService {
  constructor(private prisma: PrismaService) {}

  async create(createStructureDto: CreateStructureDto) {
    return await this.prisma.structure.create({
      data: createStructureDto,
      include: {
        user: true,
        position: true,
        period: true,
        image: true, // Akan memanggil tabel Media jika ada relasinya
      },
    });
  }

  async findAll() {
    return await this.prisma.structure.findMany({
      include: {
        user: true,
        position: true,
        period: true,
        image: true,
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.structure.findUnique({
      where: { id },
      include: {
        user: true,
        position: true,
        period: true,
        image: true,
      },
    });
  }

  async update(id: string, updateStructureDto: UpdateStructureDto) {
    return await this.prisma.structure.update({
      where: { id },
      data: updateStructureDto,
      include: {
        user: true,
        position: true,
        period: true,
        image: true,
      },
    });
  }

  async remove(id: string) {
    return await this.prisma.structure.delete({
      where: { id },
    });
  }
}