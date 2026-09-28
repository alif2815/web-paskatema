import { Logger } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';

const logger = new Logger('TreasurerRole');

/**
 * Role BENDAHARA mengikuti jabatan, bukan diatur manual: anggota yang
 * menjabat posisi bernama "Bendahara" (termasuk mis. "Wakil Bendahara") di
 * periode AKTIF otomatis ber-role BENDAHARA; bendahara yang sudah tidak
 * menjabat kembali menjadi USER. Akun ADMIN tidak pernah diubah.
 *
 * Dipanggil setelah perubahan struktur, periode, atau jabatan, dan saat
 * aplikasi start. Idempotent.
 */
export async function syncTreasurerRoles(prisma: PrismaClient): Promise<void> {
  const holders = await prisma.structure.findMany({
    where: {
      period: { isActive: true },
      position: { name: { contains: 'bendahara', mode: 'insensitive' } },
    },
    select: { userId: true },
  });
  const eligible = [...new Set(holders.map((h) => h.userId))];

  const [promoted, demoted] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: { in: eligible }, role: Role.USER },
      data: { role: Role.BENDAHARA },
    }),
    prisma.user.updateMany({
      where: { role: Role.BENDAHARA, id: { notIn: eligible } },
      data: { role: Role.USER },
    }),
  ]);

  if (promoted.count || demoted.count) {
    logger.log(
      `Role bendahara disesuaikan dengan struktur: +${promoted.count}, -${demoted.count}`,
    );
  }
}

/** true bila user menjabat posisi Bendahara di periode aktif. */
export async function holdsTreasurerPosition(
  prisma: PrismaClient,
  userId: string,
): Promise<boolean> {
  const count = await prisma.structure.count({
    where: {
      userId,
      period: { isActive: true },
      position: { name: { contains: 'bendahara', mode: 'insensitive' } },
    },
  });
  return count > 0;
}
