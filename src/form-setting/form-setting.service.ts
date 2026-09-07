import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateFormSettingDto } from './dto/create-form-setting.dto';
import { UpdateFormSettingDto } from './dto/update-form-setting.dto';

@Injectable()
export class FormSettingService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateFormSettingDto,
  ) {
    const {
      title,
      isActive = false,
      schema,
    } = dto;

    return this.prisma.$transaction(
      async (tx) => {
        // Hanya satu form yang boleh aktif.
        if (isActive) {
          await tx.formSetting.updateMany({
            where: {
              isActive: true,
            },
            data: {
              isActive: false,
            },
          });
        }

        return tx.formSetting.create({
          data: {
            title,
            isActive,
            schema:
              schema as Prisma.InputJsonValue,
          },
        });
      },
    );
  }

  async findAll() {
    return this.prisma.formSetting.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });
  }

  async findActive() {
    const form =
      await this.prisma.formSetting.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (!form) {
      throw new NotFoundException(
        'Tidak ada form pendaftaran yang sedang aktif',
      );
    }

    return form;
  }

  async findOne(id: string) {
    const form =
      await this.prisma.formSetting.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      });

    if (!form) {
      throw new NotFoundException(
        'Form pendaftaran tidak ditemukan',
      );
    }

    return form;
  }

  async update(
    id: string,
    dto: UpdateFormSettingDto,
  ) {
    const existing =
      await this.prisma.formSetting.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Form pendaftaran tidak ditemukan',
      );
    }

    // Kalau sudah ada pendaftar,
    // schema tidak boleh diubah.
    if (
      dto.schema !== undefined &&
      existing._count.registrations > 0
    ) {
      throw new ConflictException(
        'Schema form tidak dapat diubah karena sudah memiliki pendaftar',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        if (dto.isActive === true) {
          await tx.formSetting.updateMany({
            where: {
              isActive: true,
              id: {
                not: id,
              },
            },
            data: {
              isActive: false,
            },
          });
        }

        return tx.formSetting.update({
          where: {
            id,
          },
          data: {
            ...(dto.title !== undefined && {
              title: dto.title,
            }),

            ...(dto.isActive !== undefined && {
              isActive: dto.isActive,
            }),

            ...(dto.schema !== undefined && {
              schema:
                dto.schema as Prisma.InputJsonValue,
            }),
          },
        });
      },
    );
  }

  async toggleFormStatus(
    id: string,
    isActive: boolean,
  ) {
    const existing =
      await this.prisma.formSetting.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Form pendaftaran tidak ditemukan',
      );
    }

    if (!isActive) {
      return this.prisma.formSetting.update({
        where: {
          id,
        },
        data: {
          isActive: false,
        },
      });
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.formSetting.updateMany({
          where: {
            isActive: true,
            id: {
              not: id,
            },
          },
          data: {
            isActive: false,
          },
        });

        return tx.formSetting.update({
          where: {
            id,
          },
          data: {
            isActive: true,
          },
        });
      },
    );
  }

  async remove(id: string) {
    const existing =
      await this.prisma.formSetting.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Form pendaftaran tidak ditemukan',
      );
    }

    if (existing._count.registrations > 0) {
      throw new ConflictException(
        'Form tidak dapat dihapus karena sudah memiliki data pendaftaran',
      );
    }

    return this.prisma.formSetting.delete({
      where: {
        id,
      },
    });
  }
}