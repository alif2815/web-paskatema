import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';

@Injectable()
export class AchievementService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    createAchievementDto: CreateAchievementDto,
  ) {
    const {
      title,
      year,
      description,
      imageId,
    } = createAchievementDto;

    // Pastikan Media image benar-benar ada
    if (imageId) {
      const image =
        await this.prisma.media.findUnique({
          where: {
            id: imageId,
          },
        });

      if (!image) {
        throw new NotFoundException(
          'Media gambar prestasi tidak ditemukan',
        );
      }
    }

    return this.prisma.achievement.create({
      data: {
        title,
        year,
        description,
        imageId,
      },
      include: {
        image: true,
      },
    });
  }

  async findAll() {
    return this.prisma.achievement.findMany({
      orderBy: {
        year: 'desc',
      },
      include: {
        image: true,
      },
    });
  }

  async findOne(id: string) {
    const achievement =
      await this.prisma.achievement.findUnique({
        where: {
          id,
        },
        include: {
          image: true,
        },
      });

    if (!achievement) {
      throw new NotFoundException(
        'Achievement tidak ditemukan',
      );
    }

    return achievement;
  }

  async update(
    id: string,
    updateAchievementDto: UpdateAchievementDto,
  ) {
    const existingAchievement =
      await this.prisma.achievement.findUnique({
        where: {
          id,
        },
      });

    if (!existingAchievement) {
      throw new NotFoundException(
        'Achievement tidak ditemukan',
      );
    }

    const {
      title,
      year,
      description,
      imageId,
    } = updateAchievementDto;

    if (imageId) {
      const image =
        await this.prisma.media.findUnique({
          where: {
            id: imageId,
          },
        });

      if (!image) {
        throw new NotFoundException(
          'Media gambar prestasi tidak ditemukan',
        );
      }
    }

    const data: {
      title?: string;
      year?: number;
      description?: string;
      imageId?: string;
    } = {};

    if (title !== undefined) {
      data.title = title;
    }

    if (year !== undefined) {
      data.year = year;
    }

    if (description !== undefined) {
      data.description = description;
    }

    if (imageId !== undefined) {
      data.imageId = imageId;
    }

    return this.prisma.achievement.update({
      where: {
        id,
      },
      data,
      include: {
        image: true,
      },
    });
  }

  async remove(id: string) {
    const existingAchievement =
      await this.prisma.achievement.findUnique({
        where: {
          id,
        },
      });

    if (!existingAchievement) {
      throw new NotFoundException(
        'Achievement tidak ditemukan',
      );
    }

    return this.prisma.achievement.delete({
      where: {
        id,
      },
    });
  }
}