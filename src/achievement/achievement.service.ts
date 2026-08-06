import { Injectable } from '@nestjs/common';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { PrismaService } from '../prisma/prisma.service'; 

@Injectable()
export class AchievementService {
  // Menyuntikkan PrismaService agar bisa dipakai di class ini
  constructor(private prisma: PrismaService) {}

  async create(createAchievementDto: CreateAchievementDto) {
    return await this.prisma.achievement.create({
      data: createAchievementDto,
    });
  }

  async findAll() {
    return await this.prisma.achievement.findMany({
      orderBy: { year: 'desc' }, // Mengurutkan dari tahun terbaru
    });
  }

  async findOne(id: string) {
    return await this.prisma.achievement.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateAchievementDto: UpdateAchievementDto) {
    return await this.prisma.achievement.update({
      where: { id },
      data: updateAchievementDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.achievement.delete({
      where: { id },
    });
  }
}