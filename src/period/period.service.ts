import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { QueryPeriodDto } from './dto/query-period.dto';
import { syncTreasurerRoles } from '../auth/treasurer-role';

@Injectable()
export class PeriodService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPeriodDto: CreatePeriodDto) {
    const { name, isActive = false } = createPeriodDto;

    const result = await this.prisma.$transaction(async (tx) => {
      // kalau periode baru langsung aktif,
      // nonaktifkan periode aktif sebelumnya.
      if (isActive) {
        await tx.period.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return tx.period.create({
        data: { name, isActive },
      });
    });
    await syncTreasurerRoles(this.prisma);
    return result;
  }

  async findAll(query?: QueryPeriodDto) {
    return this.prisma.period.findMany({
      where: {
        ...(query?.isActive !== undefined && { isActive: query.isActive }),
      },
      orderBy: { name: 'desc' },
      // Jumlah pemakaian, untuk konfirmasi hapus di panel admin.
      include: {
        _count: { select: { structures: true, votingPeriods: true } },
      },
    });
  }

  async findActive() {
    return this.prisma.period.findFirst({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const period = await this.prisma.period.findUnique({
      where: { id },
    });

    if (!period) {
      throw new NotFoundException('Periode tidak ditemukan');
    }

    return period;
  }

  async update(id: string, updatePeriodDto: UpdatePeriodDto) {
    const existingPeriod = await this.prisma.period.findUnique({
      where: { id },
    });

    if (!existingPeriod) {
      throw new NotFoundException('Periode tidak ditemukan');
    }

    const { name, isActive } = updatePeriodDto;

    const result = await this.prisma.$transaction(async (tx) => {
      if (isActive === true) {
        await tx.period.updateMany({
          where: {
            isActive: true,
            id: { not: id },
          },
          data: { isActive: false },
        });
      }

      return tx.period.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(isActive !== undefined && { isActive }),
        },
      });
    });
    await syncTreasurerRoles(this.prisma);
    return result;
  }

  async remove(id: string) {
    const existingPeriod = await this.prisma.period.findUnique({
      where: { id },
    });

    if (!existingPeriod) {
      throw new NotFoundException('Periode tidak ditemukan');
    }

    // Pemilihan menyimpan riwayat suara: jangan ikut terhapus diam-diam.
    const votings = await this.prisma.votingPeriod.findMany({
      where: { periodId: id },
      select: { title: true },
    });
    if (votings.length > 0) {
      throw new ConflictException(
        `Periode ini dipakai pemilihan "${votings.map((v) => v.title).join('", "')}". Hapus pemilihan tersebut dulu di menu Voting.`,
      );
    }

    // Penempatan struktur tidak berarti tanpa periodenya: ikut dihapus.
    // Transaksi keuangan tetap ada (periodId jadi null, lihat schema).
    const [, result] = await this.prisma.$transaction([
      this.prisma.structure.deleteMany({ where: { periodId: id } }),
      this.prisma.period.delete({ where: { id } }),
    ]);
    await syncTreasurerRoles(this.prisma);
    return result;
  }
}
