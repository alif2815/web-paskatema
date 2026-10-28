import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, Prisma, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';
import {
  CreateOpportunityDto,
  QueryNetworkMembersDto,
  QueryOpportunityDto,
  UpdateOpportunityDto,
} from './dto/network.dto';

const PAGE_SIZE = 24;

/**
 * Jaringan Paskatema: direktori anggota dengan detail profesional dan papan
 * peluang. Hanya untuk anggota terverifikasi (punya angkatan) dan admin,
 * sama seperti aturan detail profil (lihat UserService.findMemberProfile).
 */
@Injectable()
export class NetworkService {
  constructor(private readonly prisma: PrismaService) {}

  private async viewer(user: AuthenticatedUser) {
    const row = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { angkatan: true, memberStatus: true },
    });
    const isAdmin = user.role === Role.ADMIN;
    if (!isAdmin && row?.angkatan == null) {
      throw new ForbiddenException(
        'Jaringan Paskatema hanya untuk anggota yang angkatannya sudah diverifikasi',
      );
    }
    return { id: user.id, isAdmin, memberStatus: row?.memberStatus };
  }

  async findMembers(query: QueryNetworkMembersDto, user: AuthenticatedUser) {
    await this.viewer(user);
    const page = query.page ?? 1;
    const q = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      angkatan: query.angkatan ?? { not: null },
      ...(query.memberStatus && { memberStatus: query.memberStatus }),
      ...(query.mentor && { openToMentor: true }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { occupation: { contains: q, mode: 'insensitive' } },
          { education: { contains: q, mode: 'insensitive' } },
          // Keahlian disimpan sebagai array; cocokkan beberapa variasi huruf.
          {
            skills: {
              hasSome: [
                ...new Set([
                  q,
                  q.toLowerCase(),
                  q.toUpperCase(),
                  q.charAt(0).toUpperCase() + q.slice(1).toLowerCase(),
                ]),
              ],
            },
          },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: [
          { openToMentor: 'desc' },
          { angkatan: 'desc' },
          { name: 'asc' },
        ],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          angkatan: true,
          memberStatus: true,
          occupation: true,
          education: true,
          skills: true,
          openToMentor: true,
          avatar: { select: { url: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map(({ avatar, ...m }) => ({
        ...m,
        avatarUrl: avatar?.url ?? null,
      })),
      meta: {
        total,
        page,
        limit: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    };
  }

  private readonly author = {
    select: { id: true, name: true, angkatan: true, memberStatus: true },
  };

  async findOpportunities(query: QueryOpportunityDto, user: AuthenticatedUser) {
    await this.viewer(user);
    const page = query.page ?? 1;
    const where: Prisma.OpportunityWhereInput = query.type
      ? { type: query.type }
      : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.opportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { author: this.author },
      }),
      this.prisma.opportunity.count({ where }),
    ]);
    return {
      data,
      meta: {
        total,
        page,
        limit: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    };
  }

  /** Purna (terverifikasi) dan admin boleh membagikan peluang. */
  async createOpportunity(dto: CreateOpportunityDto, user: AuthenticatedUser) {
    const viewer = await this.viewer(user);
    if (!viewer.isAdmin && viewer.memberStatus !== MemberStatus.PURNA) {
      throw new ForbiddenException(
        'Hanya purna dan admin yang dapat membagikan peluang',
      );
    }
    return this.prisma.opportunity.create({
      data: {
        title: dto.title,
        organization: dto.organization,
        type: dto.type,
        description: dto.description,
        link: dto.link || null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        authorId: user.id,
      },
      include: { author: this.author },
    });
  }

  private async findOwned(id: string, user: AuthenticatedUser) {
    const viewer = await this.viewer(user);
    const item = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Peluang tidak ditemukan');
    if (!viewer.isAdmin && item.authorId !== user.id) {
      throw new ForbiddenException(
        'Anda hanya dapat mengelola peluang yang Anda bagikan',
      );
    }
    return item;
  }

  async updateOpportunity(
    id: string,
    dto: UpdateOpportunityDto,
    user: AuthenticatedUser,
  ) {
    await this.findOwned(id, user);
    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.organization !== undefined && {
          organization: dto.organization,
        }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.link !== undefined && { link: dto.link || null }),
        ...(dto.deadline !== undefined && {
          deadline: dto.deadline ? new Date(dto.deadline) : null,
        }),
      },
      include: { author: this.author },
    });
  }

  async removeOpportunity(id: string, user: AuthenticatedUser) {
    await this.findOwned(id, user);
    await this.prisma.opportunity.delete({ where: { id } });
    return { message: 'Peluang dihapus' };
  }
}
