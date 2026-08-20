import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

@Injectable()
export class StructureService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private readonly includeRelations = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
      },
    },
    position: true,
    period: true,
    image: true,
  };

  private async validateRelations(
    data: {
      userId?: string;
      positionId?: string;
      periodId?: string;
      imageId?: string;
    },
  ) {
    if (data.userId) {
      const user =
        await this.prisma.user.findUnique({
          where: {
            id: data.userId,
          },
        });

      if (!user) {
        throw new NotFoundException(
          'User tidak ditemukan',
        );
      }
    }

    if (data.positionId) {
      const position =
        await this.prisma.position.findUnique({
          where: {
            id: data.positionId,
          },
        });

      if (!position) {
        throw new NotFoundException(
          'Jabatan tidak ditemukan',
        );
      }
    }

    if (data.periodId) {
      const period =
        await this.prisma.period.findUnique({
          where: {
            id: data.periodId,
          },
        });

      if (!period) {
        throw new NotFoundException(
          'Periode tidak ditemukan',
        );
      }
    }

    if (data.imageId) {
      const image =
        await this.prisma.media.findUnique({
          where: {
            id: data.imageId,
          },
        });

      if (!image) {
        throw new NotFoundException(
          'Media foto struktur tidak ditemukan',
        );
      }
    }
  }

  async create(
    createStructureDto: CreateStructureDto,
  ) {
    await this.validateRelations(
      createStructureDto,
    );

    try {
      return await this.prisma.structure.create({
        data: {
          userId: createStructureDto.userId,
          positionId:
            createStructureDto.positionId,
          periodId:
            createStructureDto.periodId,
          imageId:
            createStructureDto.imageId,
        },
        include: this.includeRelations,
      });
    } catch (error) {
      throw new ConflictException(
        'User sudah memiliki struktur pada periode tersebut',
      );
    }
  }

  async findAll() {
    return this.prisma.structure.findMany({
      orderBy: [
        {
          period: {
            name: 'desc',
          },
        },
        {
          position: {
            level: 'asc',
          },
        },
      ],
      include: this.includeRelations,
    });
  }

  async findOne(id: string) {
    const structure =
      await this.prisma.structure.findUnique({
        where: {
          id,
        },
        include: this.includeRelations,
      });

    if (!structure) {
      throw new NotFoundException(
        'Structure tidak ditemukan',
      );
    }

    return structure;
  }

  async update(
    id: string,
    updateStructureDto: UpdateStructureDto,
  ) {
    const existingStructure =
      await this.prisma.structure.findUnique({
        where: {
          id,
        },
      });

    if (!existingStructure) {
      throw new NotFoundException(
        'Structure tidak ditemukan',
      );
    }

    await this.validateRelations(
      updateStructureDto,
    );

    const data = {
      ...(updateStructureDto.userId !==
        undefined && {
        userId: updateStructureDto.userId,
      }),
      ...(updateStructureDto.positionId !==
        undefined && {
        positionId:
          updateStructureDto.positionId,
      }),
      ...(updateStructureDto.periodId !==
        undefined && {
        periodId:
          updateStructureDto.periodId,
      }),
      ...(updateStructureDto.imageId !==
        undefined && {
        imageId:
          updateStructureDto.imageId,
      }),
    };

    try {
      return await this.prisma.structure.update({
        where: {
          id,
        },
        data,
        include: this.includeRelations,
      });
    } catch (error) {
      throw new ConflictException(
        'User sudah memiliki struktur pada periode tersebut',
      );
    }
  }

  async remove(id: string) {
    const existingStructure =
      await this.prisma.structure.findUnique({
        where: {
          id,
        },
      });

    if (!existingStructure) {
      throw new NotFoundException(
        'Structure tidak ditemukan',
      );
    }

    return this.prisma.structure.delete({
      where: {
        id,
      },
    });
  }
}