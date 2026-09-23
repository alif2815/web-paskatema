import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/strategy/jwt-strategy';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  // Endpoint publik: hanya nama pengunggah, tanpa email/kontak.
  private readonly include = {
    image: { select: { id: true, url: true, fileName: true, mimeType: true } },
    uploader: { select: { id: true, name: true } },
  };

  async create(dto: CreateGalleryDto, user: AuthenticatedUser) {
    const isAdmin = user.role === Role.ADMIN;
    let angkatan: number;

    if (isAdmin) {
      if (!dto.angkatan) {
        throw new BadRequestException('Angkatan wajib diisi');
      }
      angkatan = dto.angkatan;
    } else {
      // Anggota hanya boleh menambah foto untuk angkatannya sendiri. Angkatan
      // diisi admin, jadi akun yang belum diverifikasi tidak bisa mengisi galeri.
      const member = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { angkatan: true },
      });
      if (member?.angkatan == null) {
        throw new ForbiddenException(
          'Angkatan Anda belum diisi admin, jadi belum bisa menambah foto',
        );
      }
      angkatan = member.angkatan;
    }

    const image = await this.prisma.media.findUnique({
      where: { id: dto.imageId },
    });
    if (!image) {
      throw new NotFoundException('Media foto tidak ditemukan');
    }
    if (!image.mimeType.startsWith('image/')) {
      throw new BadRequestException('Media harus berupa gambar');
    }
    // Anggota hanya boleh memakai foto yang ia unggah sendiri (bukan media
    // milik orang lain).
    if (!isAdmin && image.uploaderId !== user.id) {
      throw new ForbiddenException('Foto ini bukan unggahan Anda');
    }

    return this.prisma.galleryPhoto.create({
      data: {
        angkatan,
        caption: dto.caption || null,
        imageId: dto.imageId,
        uploaderId: user.id,
      },
      include: this.include,
    });
  }

  findAll(query: QueryGalleryDto) {
    return this.prisma.galleryPhoto.findMany({
      where: query.angkatan ? { angkatan: query.angkatan } : undefined,
      orderBy: [{ angkatan: 'desc' }, { createdAt: 'desc' }],
      include: this.include,
    });
  }

  /** Foto yang diunggah user yang sedang login. */
  findMine(userId: string) {
    return this.prisma.galleryPhoto.findMany({
      where: { uploaderId: userId },
      orderBy: { createdAt: 'desc' },
      include: this.include,
    });
  }

  /** Daftar angkatan yang punya foto beserta jumlahnya (untuk filter publik). */
  async findAngkatan() {
    const groups = await this.prisma.galleryPhoto.groupBy({
      by: ['angkatan'],
      _count: { _all: true },
      orderBy: { angkatan: 'desc' },
    });

    return groups.map((group) => ({
      angkatan: group.angkatan,
      count: group._count._all,
    }));
  }

  async findOne(id: string) {
    const photo = await this.prisma.galleryPhoto.findUnique({
      where: { id },
      include: this.include,
    });
    if (!photo) {
      throw new NotFoundException('Foto galeri tidak ditemukan');
    }
    return photo;
  }

  /** Admin boleh mengubah/menghapus semua foto; anggota hanya miliknya. */
  private async findManageable(id: string, user: AuthenticatedUser) {
    const photo = await this.findOne(id);
    if (user.role !== Role.ADMIN && photo.uploader?.id !== user.id) {
      throw new ForbiddenException('Anda hanya dapat mengelola foto sendiri');
    }
    return photo;
  }

  async update(id: string, dto: UpdateGalleryDto, user: AuthenticatedUser) {
    await this.findManageable(id, user);

    return this.prisma.galleryPhoto.update({
      where: { id },
      data: {
        // Pindah angkatan hanya untuk admin.
        ...(user.role === Role.ADMIN &&
          dto.angkatan != null && { angkatan: dto.angkatan }),
        // caption boleh dikosongkan (string kosong -> null)
        ...(dto.caption !== undefined && { caption: dto.caption || null }),
      },
      include: this.include,
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.findManageable(id, user);
    await this.prisma.galleryPhoto.delete({ where: { id } });
    return { message: 'Foto galeri berhasil dihapus' };
  }
}
