import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

const INCLUDE = {
  image: { select: { id: true, url: true, mimeType: true, fileName: true } },
};

function cleanOptions(options: string[] | undefined): string[] | undefined {
  return options === undefined
    ? undefined
    : [...new Set(options.map((o) => o.trim()).filter(Boolean))];
}

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /** Publik: hanya produk aktif. Pengelola: semua. */
  findAll(includeInactive: boolean) {
    return this.prisma.product.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: INCLUDE,
    });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        price: dto.price,
        stock: dto.stock ?? null,
        options: cleanOptions(dto.options) ?? [],
        isActive: dto.isActive ?? true,
        imageId: dto.imageId || null,
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && {
          description: dto.description || null,
        }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.options !== undefined && {
          options: cleanOptions(dto.options),
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.imageId !== undefined && { imageId: dto.imageId || null }),
      },
      include: INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Riwayat pembayaran tetap ada (productId jadi null, lihat schema).
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Produk dihapus' };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }
}
