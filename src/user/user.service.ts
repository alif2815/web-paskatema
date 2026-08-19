import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Sesuaikan path prisma service-mu
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  // 1. Ambil semua user (Khusus Admin)
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        bio: true,
        createdAt: true,
        // Password sengaja tidak disertakan demi keamanan
      },
    });
  }

  // 2. Ambil profil berdasarkan ID
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    return user;
  }

  // 3. Update Profil Diri Sendiri
  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        bio: true,
      },
    });
  }

  // 4. Update Role User (Khusus Admin)
  async updateRole(id: string, dto: UpdateRoleDto) {
    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  // 5. Hapus User (Khusus Admin)
  async remove(id: string) {
    await this.findById(id); // Pastikan user ada dulu
    return this.prisma.user.delete({
      where: { id },
    });
  }
}