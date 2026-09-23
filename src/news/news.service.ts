import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { NewsFileService } from './news-file.service';

import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

const newsInclude = {
  author: {
    select: {
      id: true,
      name: true,
    },
  },
  cover: true,
} satisfies Prisma.NewsInclude;

type NewsWithRelations = Prisma.NewsGetPayload<{ include: typeof newsInclude }>;

@Injectable()
export class NewsService implements OnModuleInit {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: NewsFileService,
  ) {}

  /**
   * Berita lama (dibuat saat isi masih di kolom `content`) dipindahkan ke file
   * .md sekali saja saat startup. Kolom `content` baru dikosongkan setelah
   * file benar-benar tertulis, jadi tidak ada data yang hilang jika gagal.
   */
  async onModuleInit() {
    const legacy = await this.prisma.news.findMany({
      where: { filePath: null, content: { not: null } },
      include: newsInclude,
    });

    for (const news of legacy) {
      try {
        const fileName = this.files.fileNameFor(news.id);
        await this.files.write(fileName, this.metaOf(news), news.content ?? '');
        await this.prisma.news.update({
          where: { id: news.id },
          data: { filePath: fileName, content: null },
        });
      } catch (error) {
        this.logger.error(
          `Gagal memigrasikan berita ${news.id} ke file .md: ${String(error)}`,
        );
      }
    }

    if (legacy.length > 0) {
      this.logger.log(`Migrasi berita ke file .md selesai (${legacy.length})`);
    }
  }

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
      const existingNews = await this.prisma.news.findUnique({
        where: {
          slug,
        },
      });

      if (!existingNews || existingNews.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private metaOf(news: NewsWithRelations) {
    return {
      title: news.title,
      slug: news.slug,
      author: news.author.name,
      createdAt: news.createdAt,
      cover: news.cover?.url ?? null,
    };
  }

  /** Foto berita (satu-satunya, sebagai sampul) harus gambar yang ada. */
  private async ensureCover(coverId: string) {
    const cover = await this.prisma.media.findUnique({
      where: { id: coverId },
    });

    if (!cover) {
      throw new NotFoundException('Media cover tidak ditemukan');
    }
    if (!cover.mimeType.startsWith('image/')) {
      throw new BadRequestException('Foto berita harus berupa gambar');
    }
  }

  /** Bentuk respons API: isi berita dibaca dari file .md, tanpa `filePath`. */
  private async toResponse(news: NewsWithRelations) {
    const { filePath, ...rest } = news;

    let content = news.content ?? '';
    if (filePath) {
      const body = await this.files.readBody(filePath);
      if (body === null) {
        this.logger.warn(`File berita hilang: ${filePath} (berita ${news.id})`);
      }
      content = body ?? '';
    }

    return { ...rest, content };
  }

  async create(createNewsDto: CreateNewsDto, authorId: string) {
    const { title, content, coverId } = createNewsDto;

    //  user e harus ada dan pasti ada
    const author = await this.prisma.user.findUnique({
      where: {
        id: authorId,
      },
    });

    if (!author) {
      throw new NotFoundException('Author tidak ditemukan');
    }

    if (coverId) {
      await this.ensureCover(coverId);
    }

    const slug = await this.generateUniqueSlug(title);

    // id dibuat di sini karena nama file memakai id, dan file ditulis lebih
    // dulu; jika insert DB gagal, file dihapus lagi.
    const id = randomUUID();
    const fileName = this.files.fileNameFor(id);
    const cover = coverId
      ? await this.prisma.media.findUnique({ where: { id: coverId } })
      : null;

    await this.files.write(
      fileName,
      {
        title,
        slug,
        author: author.name,
        createdAt: new Date(),
        cover: cover?.url ?? null,
      },
      content,
    );

    try {
      const news = await this.prisma.news.create({
        data: {
          id,
          title,
          slug,
          filePath: fileName,
          authorId,
          coverId,
        },
        include: newsInclude,
      });

      return await this.toResponse(news);
    } catch (error) {
      await this.files.remove(fileName);
      throw error;
    }
  }

  async findAll() {
    const items = await this.prisma.news.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: newsInclude,
    });

    return Promise.all(items.map((news) => this.toResponse(news)));
  }

  async findOne(id: string) {
    const news = await this.prisma.news.findUnique({
      where: {
        id,
      },
      include: newsInclude,
    });

    if (!news) {
      throw new NotFoundException('Berita tidak ditemukan');
    }

    return this.toResponse(news);
  }

  async findBySlug(slug: string) {
    const news = await this.prisma.news.findUnique({
      where: {
        slug,
      },
      include: newsInclude,
    });

    if (!news) {
      throw new NotFoundException('Berita tidak ditemukan');
    }

    return this.toResponse(news);
  }

  async update(id: string, updateNewsDto: UpdateNewsDto) {
    const existingNews = await this.prisma.news.findUnique({
      where: {
        id,
      },
      include: newsInclude,
    });

    if (!existingNews) {
      throw new NotFoundException('Berita tidak ditemukan');
    }

    const { title, content, coverId } = updateNewsDto;

    if (coverId) {
      await this.ensureCover(coverId);
    }

    const data: {
      title?: string;
      slug?: string;
      coverId?: string | null;
      filePath?: string;
      content?: null;
    } = {};

    if (title !== undefined) {
      data.title = title;

      data.slug = await this.generateUniqueSlug(title, id);
    }

    if (coverId !== undefined) {
      data.coverId = coverId;
    }

    // Tulis ulang file .md jika ada yang berubah (isi, judul/slug, atau foto).
    const fileName = this.files.fileNameFor(id);
    const currentBody = existingNews.filePath
      ? await this.files.readBody(existingNews.filePath)
      : existingNews.content;
    const previousRaw = await this.files.readRaw(fileName);

    const nextCover =
      coverId === undefined
        ? (existingNews.cover?.url ?? null)
        : coverId
          ? ((await this.prisma.media.findUnique({ where: { id: coverId } }))
              ?.url ?? null)
          : null;

    await this.files.write(
      fileName,
      {
        title: data.title ?? existingNews.title,
        slug: data.slug ?? existingNews.slug,
        author: existingNews.author.name,
        createdAt: existingNews.createdAt,
        cover: nextCover,
      },
      content ?? currentBody ?? '',
    );

    // Berita lama yang belum bermigrasi ikut berpindah ke file di sini.
    data.filePath = fileName;
    data.content = null;

    try {
      const updated = await this.prisma.news.update({
        where: {
          id,
        },
        data,
        include: newsInclude,
      });

      return await this.toResponse(updated);
    } catch (error) {
      await this.files.restoreRaw(fileName, previousRaw);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Gagal memperbarui berita');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const existingNews = await this.prisma.news.findUnique({
      where: {
        id,
      },
    });

    if (!existingNews) {
      throw new NotFoundException('Berita tidak ditemukan');
    }

    const deleted = await this.prisma.news.delete({
      where: {
        id,
      },
    });

    if (existingNews.filePath) {
      await this.files.remove(existingNews.filePath);
    }

    const { filePath, ...rest } = deleted;
    void filePath;
    return rest;
  }
}
