import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(file: Express.Multer.File, uploaderId: string, baseUrl: string) {
    if (!file) {
      throw new Error('File wajib diupload');
    }

    // Prefix /api wajib ada karena di domain publik, Traefik cuma
    // meneruskan path yang diawali /api ke backend ini (lihat
    // docker-compose.yml) — tanpa prefix ini URL-nya akan 404.
    // Gambar & video lewat StorageService (lokal atau Cloudinary); PDF selalu lokal.
    const isVideo = file.mimetype.startsWith('video/');
    const stored =
      file.mimetype.startsWith('image/') || isVideo
        ? await this.storage.saveDiskFile(
            file,
            baseUrl,
            isVideo ? 'video' : 'media',
          )
        : {
            url: `${baseUrl}/api/uploads/${file.filename}`,
            publicId: null,
          };

    try {
      return await this.prisma.media.create({
        data: {
          fileName: file.originalname,
          url: stored.url,
          publicId: stored.publicId,
          mimeType: file.mimetype,
          size: file.size,
          uploaderId,
        },
      });
    } catch (error) {
      // Jangan tinggalkan file yatim jika insert DB gagal.
      await this.storage.remove({ ...stored, mimeType: file.mimetype });
      throw error;
    }
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
      throw new NotFoundException('Media tidak ditemukan');
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
      throw new NotFoundException('Media tidak ditemukan');
    }

    const deleted = await this.prisma.media.delete({
      where: {
        id,
      },
    });

    await this.storage.remove(media);

    return deleted;
  }
}
