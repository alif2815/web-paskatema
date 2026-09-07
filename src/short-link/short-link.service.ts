import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { UpdateShortLinkDto } from './dto/update-short-link.dto';

@Injectable()
export class ShortLinkService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private generateCode(): string {
    return randomBytes(4)
      .toString('base64url')
      .slice(0, 6);
  }

  private async generateUniqueCode() {
    let code = this.generateCode();

    while (
      await this.prisma.shortLink.findUnique({
        where: {
          code,
        },
      })
    ) {
      code = this.generateCode();
    }

    return code;
  }

  async create(
    createShortLinkDto: CreateShortLinkDto,
  ) {
    const {
      originalUrl,
      code: requestedCode,
    } = createShortLinkDto;

    let code = requestedCode;

    if (code) {
      const existing =
        await this.prisma.shortLink.findUnique({
          where: {
            code,
          },
        });

      if (existing) {
        throw new ConflictException(
          'Code short link sudah digunakan',
        );
      }
    } else {
      code =
        await this.generateUniqueCode();
    }

    return this.prisma.shortLink.create({
      data: {
        code,
        originalUrl,
      },
    });
  }

  async findAll() {
    return this.prisma.shortLink.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const shortLink =
      await this.prisma.shortLink.findUnique({
        where: {
          id,
        },
      });

    if (!shortLink) {
      throw new NotFoundException(
        'Short link tidak ditemukan',
      );
    }

    return shortLink;
  }

  async update(
    id: string,
    updateShortLinkDto: UpdateShortLinkDto,
  ) {
    const existing =
      await this.prisma.shortLink.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Short link tidak ditemukan',
      );
    }

    if (updateShortLinkDto.code) {
      const codeOwner =
        await this.prisma.shortLink.findUnique({
          where: {
            code: updateShortLinkDto.code,
          },
        });

      if (
        codeOwner &&
        codeOwner.id !== id
      ) {
        throw new ConflictException(
          'Code short link sudah digunakan',
        );
      }
    }

    return this.prisma.shortLink.update({
      where: {
        id,
      },
      data: {
        ...(updateShortLinkDto.originalUrl !==
          undefined && {
          originalUrl:
            updateShortLinkDto.originalUrl,
        }),
        ...(updateShortLinkDto.code !==
          undefined && {
          code: updateShortLinkDto.code,
        }),
      },
    });
  }

  async remove(id: string) {
    const existing =
      await this.prisma.shortLink.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Short link tidak ditemukan',
      );
    }

    return this.prisma.shortLink.delete({
      where: {
        id,
      },
    });
  }

  async redirect(code: string) {
    const shortLink =
      await this.prisma.shortLink.findUnique({
        where: {
          code,
        },
      });

    if (!shortLink) {
      throw new NotFoundException(
        'Short link tidak ditemukan',
      );
    }

    const updated =
      await this.prisma.shortLink.update({
        where: {
          id: shortLink.id,
        },
        data: {
          clicks: {
            increment: 1,
          },
        },
      });

    return {
      originalUrl: updated.originalUrl,
      clicks: updated.clicks,
    };
  }
}