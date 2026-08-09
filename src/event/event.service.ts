import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    const {
      title,
      description,
      date,
      location,
      posterId,
    } = createEventDto;

    if (posterId) {
      const poster = await this.prisma.media.findUnique({
        where: {
          id: posterId,
        },
      });

      if (!poster) {
        throw new NotFoundException(
          'Media poster tidak ditemukan',
        );
      }
    }

    return this.prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        posterId,
      },
      include: {
        poster: true,
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
      },
    });

    if (!event) {
      throw new NotFoundException(
        'Event tidak ditemukan',
      );
    }

    return event;
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
      },
    });
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ) {
    const existingEvent =
      await this.prisma.event.findUnique({
        where: {
          id,
        },
      });

    if (!existingEvent) {
      throw new NotFoundException(
        'Event tidak ditemukan',
      );
    }

    const data: any = {
      ...updateEventDto,
    };

    if (updateEventDto.date) {
      data.date = new Date(updateEventDto.date);
    }

    if (updateEventDto.posterId) {
      const poster = await this.prisma.media.findUnique({
        where: {
          id: updateEventDto.posterId,
        },
      });

      if (!poster) {
        throw new NotFoundException(
          'Media poster tidak ditemukan',
        );
      }
    }

    return this.prisma.event.update({
      where: {
        id,
      },
      data,
      include: {
        poster: true,
      },
    });
  }

  async remove(id: string) {
    const existingEvent =
      await this.prisma.event.findUnique({
        where: {
          id,
        },
      });

    if (!existingEvent) {
      throw new NotFoundException(
        'Event tidak ditemukan',
      );
    }

    return this.prisma.event.delete({
      where: {
        id,
      },
    });
  }
}