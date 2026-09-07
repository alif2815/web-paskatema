import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    file: Express.Multer.File,
    uploaderId: string,
    baseUrl: string,
  ) {
    if (!file) {
      throw new Error('File wajib diupload');
    }

    const url = `${baseUrl}/uploads/${file.filename}`;

    return this.prisma.media.create({
      data: {
        fileName: file.originalname,
        url,
        mimeType: file.mimetype,
        size: file.size,
        uploaderId,
      },
    });
  }

  async findAll() {
    return this.prisma.media.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({
      where: {
        id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException(
        'Media tidak ditemukan',
      );
    }

    return media;
  }

  async remove(id: string) {
    const media = await this.prisma.media.findUnique({
      where: {
        id,
      },
    });

    if (!media) {
      throw new NotFoundException(
        'Media tidak ditemukan',
      );
    }

    return this.prisma.media.delete({
      where: {
        id,
      },
    });
  }
}