import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  /** Video event harus Media yang ada dan bertipe video. */
  private async assertVideo(videoId: string | null | undefined) {
    if (!videoId) return;
    const video = await this.prisma.media.findUnique({
      where: { id: videoId },
    });
    if (!video) {
      throw new NotFoundException('Media video tidak ditemukan');
    }
    if (!video.mimeType.startsWith('video/')) {
      throw new BadRequestException('Media dokumentasi harus berupa video');
    }
  }

  async create(createEventDto: CreateEventDto) {
    const { title, description, date, location, posterId, videoId } =
      createEventDto;

    // Pastikan poster Media benar-benar ada
    if (posterId) {
      const poster = await this.prisma.media.findUnique({
        where: {
          id: posterId,
        },
      });

      if (!poster) {
        throw new NotFoundException('Media poster tidak ditemukan');
      }
    }

    await this.assertVideo(videoId);

    return this.prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        posterId,
        videoId,
      },
      include: {
        poster: true,
        video: true,
      },
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      orderBy: {
        date: 'asc',
      },
      include: {
        poster: true,
        video: true,
      },
    });
  }

  async findUpcoming() {
    return this.prisma.event.findMany({
      where: {
        date: {
          gte: new Date(),
        },
      },
      orderBy: {
        date: 'asc',
      },
      include: {
        poster: true,
        video: true,
      },
    });
  }

  async findPast() {
    return this.prisma.event.findMany({
      where: {
        date: {
          lt: new Date(),
        },
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        poster: true,
        video: true,
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        poster: true,
        video: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const existingEvent = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    const { title, description, date, location, posterId, videoId } =
      updateEventDto;
    await this.assertVideo(videoId);

    // Cek poster baru jika dikirim
    if (posterId) {
      const poster = await this.prisma.media.findUnique({
        where: {
          id: posterId,
        },
      });

      if (!poster) {
        throw new NotFoundException('Media poster tidak ditemukan');
      }
    }

    const data: {
      title?: string;
      description?: string;
      date?: Date;
      location?: string;
      posterId?: string;
      videoId?: string | null;
    } = {};

    if (title !== undefined) {
      data.title = title;
    }

    if (description !== undefined) {
      data.description = description;
    }

    if (date !== undefined) {
      data.date = new Date(date);
    }

    if (location !== undefined) {
      data.location = location;
    }

    if (posterId !== undefined) {
      data.posterId = posterId;
    }
    // null = hapus video dari event.
    if (videoId !== undefined) {
      data.videoId = videoId;
    }

    return this.prisma.event.update({
      where: {
        id,
      },
      data,
      include: {
        poster: true,
        video: true,
      },
    });
  }

  async remove(id: string) {
    const existingEvent = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    return this.prisma.event.delete({
      where: {
        id,
      },
    });
  }
}
