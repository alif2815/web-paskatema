import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateUniqueSlug(
    title: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = this.generateSlug(title);

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingNews =
        await this.prisma.news.findUnique({
          where: {
            slug,
          },
        });

      if (
        !existingNews ||
        existingNews.id === excludeId
      ) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(
    createNewsDto: CreateNewsDto,
    authorId: string,
  ) {
    const {
      title,
      content,
      coverId,
    } = createNewsDto;

    //  user e harus ada dan pasti ada
    const author = await this.prisma.user.findUnique({
      where: {
        id: authorId,
      },
    });

    if (!author) {
      throw new NotFoundException(
        'Author tidak ditemukan',
      );
    }

    if (coverId) {
      const cover =
        await this.prisma.media.findUnique({
          where: {
            id: coverId,
          },
        });

      if (!cover) {
        throw new NotFoundException(
          'Media cover tidak ditemukan',
        );
      }
    }

    const slug =
      await this.generateUniqueSlug(title);

    return this.prisma.news.create({
      data: {
        title,
        slug,
        content,
        authorId,
        coverId,
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        cover: true,
      },
    });
  }

  async findAll() {
    return this.prisma.news.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },

        cover: true,
      },
    });
  }

  async findOne(id: string) {
    const news =
      await this.prisma.news.findUnique({
        where: {
          id,
        },

        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          cover: true,
        },
      });

    if (!news) {
      throw new NotFoundException(
        'Berita tidak ditemukan',
      );
    }

    return news;
  }

  async findBySlug(slug: string) {
    const news =
      await this.prisma.news.findUnique({
        where: {
          slug,
        },

        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },

          cover: true,
        },
      });

    if (!news) {
      throw new NotFoundException(
        'Berita tidak ditemukan',
      );
    }

    return news;
  }

  async update(
    id: string,
    updateNewsDto: UpdateNewsDto,
  ) {
    const existingNews =
      await this.prisma.news.findUnique({
        where: {
          id,
        },
      });

    if (!existingNews) {
      throw new NotFoundException(
        'Berita tidak ditemukan',
      );
    }

    const {
      title,
      content,
      coverId,
    } = updateNewsDto;

    if (coverId) {
      const cover =
        await this.prisma.media.findUnique({
          where: {
            id: coverId,
          },
        });

      if (!cover) {
        throw new NotFoundException(
          'Media cover tidak ditemukan',
        );
      }
    }

    const data: {
      title?: string;
      content?: string;
      slug?: string;
      coverId?: string;
    } = {};

    if (title !== undefined) {
      data.title = title;

      data.slug =
        await this.generateUniqueSlug(
          title,
          id,
        );
    }

    if (content !== undefined) {
      data.content = content;
    }

    if (coverId !== undefined) {
      data.coverId = coverId;
    }

    try {
      return await this.prisma.news.update({
        where: {
          id,
        },

        data,

        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          cover: true,
        },
      });
    } catch (error) {
      throw new ConflictException(
        'Gagal memperbarui berita',
      );
    }
  }

  async remove(id: string) {
    const existingNews =
      await this.prisma.news.findUnique({
        where: {
          id,
        },
      });

    if (!existingNews) {
      throw new NotFoundException(
        'Berita tidak ditemukan',
      );
    }

    return this.prisma.news.delete({
      where: {
        id,
      },
    });
  }
}