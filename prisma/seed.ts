/**
 * Seed satu-satunya akun ADMIN aplikasi ini.
 *
 * Sengaja idempotent (aman dijalankan berkali-kali — upsert berdasarkan
 * email) karena ini SATU-SATUNYA jalur resmi untuk membuat akun ADMIN.
 * Sejak perbaikan keamanan sebelumnya, endpoint publik POST /auth/register
 * TIDAK PERNAH membuat akun dengan role ADMIN (selalu USER), jadi akun
 * admin pertama harus dibuat lewat script ini.
 *
 * Menjalankan:
 *   ADMIN_EMAIL=admin@paskatema.com ADMIN_PASSWORD=... npx prisma db seed
 *
 * ADMIN_PASSWORD wajib diisi lewat environment variable — TIDAK ADA
 * password default di source code. Setelah login pertama, segera ganti
 * password lewat endpoint change-password.
 */
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Administrator';

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL dan ADMIN_PASSWORD wajib di-set sebagai environment ' +
        'variable saat menjalankan seed ini. Contoh:\n' +
        '  ADMIN_EMAIL=admin@paskatema.com ADMIN_PASSWORD=passwordkuat npx prisma db seed',
    );
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD minimal 8 karakter.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name,
      role: Role.ADMIN,
    },
    create: {
      email,
      password: hashedPassword,
      name,
      role: Role.ADMIN,
    },
    select: { id: true, email: true, role: true },
  });

  console.log(
    `Admin siap: ${admin.email} (id: ${admin.id}, role: ${admin.role})`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
