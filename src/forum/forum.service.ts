import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/strategy/jwt-strategy';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { PostBodyDto } from './dto/post-body.dto';
import { QueryThreadDto } from './dto/query-thread.dto';

const THREADS_PER_PAGE = 20;

/** Pengakses forum: role + angkatan terbaru dari database. */
interface ForumMember {
  id: string;
  isAdmin: boolean;
  angkatan: number | null;
}

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly author = {
    select: {
      id: true,
      name: true,
      angkatan: true,
      role: true,
      avatar: { select: { url: true } },
    },
  };

  /**
   * Forum hanya untuk anggota yang angkatannya sudah diisi admin (akun asing
   * atau belum diverifikasi tidak ikut masuk); admin selalu boleh. Angkatan
   * dibaca ulang dari database karena bisa diubah admin kapan saja.
   */
  private async member(user: AuthenticatedUser): Promise<ForumMember> {
    const isAdmin = user.role === Role.ADMIN;
    const row = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { angkatan: true },
    });
    const angkatan = row?.angkatan ?? null;
    if (!isAdmin && angkatan === null) {
      throw new ForbiddenException(
        'Forum hanya untuk anggota yang angkatannya sudah diisi admin',
      );
    }
    return { id: user.id, isAdmin, angkatan };
  }

  /** Forum Umum (null) terbuka untuk semua anggota; forum angkatan hanya anggotanya. */
  private assertBoard(member: ForumMember, angkatan: number | null) {
    if (angkatan !== null && !member.isAdmin && member.angkatan !== angkatan) {
      throw new ForbiddenException(
        'Forum ini khusus untuk anggota Angkatan ' + angkatan,
      );
    }
  }

  private async findThreadRow(id: string) {
    const thread = await this.prisma.forumThread.findUnique({ where: { id } });
    if (!thread) {
      throw new NotFoundException('Topik tidak ditemukan');
    }
    return thread;
  }

  /** Daftar forum yang bisa dibuka user ini. */
  async boards(user: AuthenticatedUser) {
    const member = await this.member(user);
    let angkatanList: number[];
    if (member.isAdmin) {
      const rows = await this.prisma.user.findMany({
        where: { angkatan: { not: null } },
        distinct: ['angkatan'],
        select: { angkatan: true },
        orderBy: { angkatan: 'desc' },
      });
      angkatanList = rows.map((r) => r.angkatan as number);
    } else {
      angkatanList = [member.angkatan as number];
    }
    return {
      myAngkatan: member.angkatan,
      isModerator: member.isAdmin,
      angkatan: angkatanList,
    };
  }

  async findThreads(query: QueryThreadDto, user: AuthenticatedUser) {
    const member = await this.member(user);
    const angkatan = query.angkatan ?? null;
    this.assertBoard(member, angkatan);

    const page = query.page ?? 1;
    const where: Prisma.ForumThreadWhereInput = {
      angkatan,
      ...(query.search && {
        title: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [threads, total] = await this.prisma.$transaction([
      this.prisma.forumThread.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { lastActivityAt: 'desc' }],
        skip: (page - 1) * THREADS_PER_PAGE,
        take: THREADS_PER_PAGE,
        select: {
          id: true,
          title: true,
          angkatan: true,
          isPinned: true,
          isLocked: true,
          lastActivityAt: true,
          createdAt: true,
          author: this.author,
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.forumThread.count({ where }),
    ]);

    return {
      data: threads.map(({ _count, ...t }) => ({
        ...t,
        replyCount: _count.posts,
      })),
      meta: {
        total,
        page,
        limit: THREADS_PER_PAGE,
        totalPages: Math.ceil(total / THREADS_PER_PAGE),
      },
    };
  }

  async findThread(id: string, user: AuthenticatedUser) {
    const member = await this.member(user);
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
      include: {
        author: this.author,
        posts: {
          orderBy: { createdAt: 'asc' },
          include: { author: this.author },
        },
      },
    });
    if (!thread) {
      throw new NotFoundException('Topik tidak ditemukan');
    }
    this.assertBoard(member, thread.angkatan);
    return thread;
  }

  async createThread(dto: CreateThreadDto, user: AuthenticatedUser) {
    const member = await this.member(user);
    const angkatan = dto.angkatan ?? null;
    this.assertBoard(member, angkatan);

    return this.prisma.forumThread.create({
      data: {
        title: dto.title,
        body: dto.body,
        angkatan,
        authorId: member.id,
      },
      include: { author: this.author },
    });
  }

  async updateThread(
    id: string,
    dto: UpdateThreadDto,
    user: AuthenticatedUser,
  ) {
    const member = await this.member(user);
    const thread = await this.findThreadRow(id);
    this.assertBoard(member, thread.angkatan);

    const editsContent = dto.title !== undefined || dto.body !== undefined;
    const moderates = dto.isPinned !== undefined || dto.isLocked !== undefined;
    if (editsContent && thread.authorId !== member.id && !member.isAdmin) {
      throw new ForbiddenException('Anda hanya dapat mengedit topik sendiri');
    }
    if (moderates && !member.isAdmin) {
      throw new ForbiddenException(
        'Hanya admin yang dapat menyematkan/mengunci topik',
      );
    }

    return this.prisma.forumThread.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
        ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
      },
      include: { author: this.author },
    });
  }

  async removeThread(id: string, user: AuthenticatedUser) {
    const member = await this.member(user);
    const thread = await this.findThreadRow(id);
    this.assertBoard(member, thread.angkatan);
    if (thread.authorId !== member.id && !member.isAdmin) {
      throw new ForbiddenException('Anda hanya dapat menghapus topik sendiri');
    }
    await this.prisma.forumThread.delete({ where: { id } });
    return { message: 'Topik berhasil dihapus' };
  }

  async createPost(
    threadId: string,
    dto: PostBodyDto,
    user: AuthenticatedUser,
  ) {
    const member = await this.member(user);
    const thread = await this.findThreadRow(threadId);
    this.assertBoard(member, thread.angkatan);
    if (thread.isLocked && !member.isAdmin) {
      throw new ForbiddenException('Topik ini sudah dikunci admin');
    }

    const now = new Date();
    const [post] = await this.prisma.$transaction([
      this.prisma.forumPost.create({
        data: { body: dto.body, threadId, authorId: member.id, createdAt: now },
        include: { author: this.author },
      }),
      this.prisma.forumThread.update({
        where: { id: threadId },
        data: { lastActivityAt: now },
      }),
    ]);
    return post;
  }

  private async findPostWithBoard(id: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
      include: { thread: { select: { angkatan: true } } },
    });
    if (!post) {
      throw new NotFoundException('Balasan tidak ditemukan');
    }
    return post;
  }

  async updatePost(id: string, dto: PostBodyDto, user: AuthenticatedUser) {
    const member = await this.member(user);
    const post = await this.findPostWithBoard(id);
    this.assertBoard(member, post.thread.angkatan);
    // Isi balasan hanya boleh diubah penulisnya (admin cukup menghapus).
    if (post.authorId !== member.id) {
      throw new ForbiddenException('Anda hanya dapat mengedit balasan sendiri');
    }
    return this.prisma.forumPost.update({
      where: { id },
      data: { body: dto.body },
      include: { author: this.author },
    });
  }

  async removePost(id: string, user: AuthenticatedUser) {
    const member = await this.member(user);
    const post = await this.findPostWithBoard(id);
    this.assertBoard(member, post.thread.angkatan);
    if (post.authorId !== member.id && !member.isAdmin) {
      throw new ForbiddenException(
        'Anda hanya dapat menghapus balasan sendiri',
      );
    }
    await this.prisma.forumPost.delete({ where: { id } });
    return { message: 'Balasan berhasil dihapus' };
  }
}
