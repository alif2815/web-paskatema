import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';

@Injectable()
export class EbookService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEbookDto: CreateEbookDto) {
    const { title, description, fileId } = createEbookDto;

    const file = await this.prisma.media.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!file) {
      throw new NotFoundException('File EBook tidak ditemukan');
    }

    if (file.mimeType !== 'application/pdf') {
      throw new ConflictException(
        'Media yang digunakan untuk EBook harus berupa PDF',
      );
    }

    return this.prisma.eBook.create({
      data: {
        title,
        description,
        fileId,
      },
      include: {
        file: true,
      },
    });
  }

  async findAll() {
    return this.prisma.eBook.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        file: true,
      },
    });
  }

  async findOne(id: string) {
    const ebook = await this.prisma.eBook.findUnique({
      where: {
        id,
      },
      include: {
        file: true,
      },
    });

    if (!ebook) {
      throw new NotFoundException('EBook tidak ditemukan');
    }

    return ebook;
  }

  async update(id: string, updateEbookDto: UpdateEbookDto) {
    const existingEbook = await this.prisma.eBook.findUnique({
      where: {
        id,
      },
    });

    if (!existingEbook) {
      throw new NotFoundException('EBook tidak ditemukan');
    }

    const { title, description, fileId } = updateEbookDto;

    if (fileId) {
      const file = await this.prisma.media.findUnique({
        where: {
          id: fileId,
        },
      });

      if (!file) {
        throw new NotFoundException('File EBook tidak ditemukan');
      }

      if (file.mimeType !== 'application/pdf') {
        throw new ConflictException('File EBook harus berupa PDF');
      }
    }

    return this.prisma.eBook.update({
      where: {
        id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && {
          description,
        }),
        ...(fileId !== undefined && { fileId }),
      },
      include: {
        file: true,
      },
    });
  }

  async remove(id: string) {
    const ebook = await this.prisma.eBook.findUnique({
      where: {
        id,
      },
    });

    if (!ebook) {
      throw new NotFoundException('EBook tidak ditemukan');
    }

    return this.prisma.eBook.delete({
      where: {
        id,
      },
    });
  }
}
