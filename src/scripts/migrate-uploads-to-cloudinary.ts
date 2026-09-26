/**
 * Pindahkan foto & video lama dari uploads/ ke Cloudinary (sekali jalan).
 *
 * Untuk setiap record Media yang masih lokal (publicId null, URL berisi
 * /api/uploads/) dan bertipe gambar/video: file diunggah ke Cloudinary, lalu
 * url + publicId di database diperbarui. Semua relasi (avatar, cover berita,
 * galeri, struktur, dst.) menunjuk ke record Media, jadi ikut berpindah.
 *
 * - PDF (E-Book) dilewati: tetap lokal.
 * - File lokal TIDAK dihapus (tetap jadi cadangan); hapus manual bila yakin.
 * - Aman dijalankan ulang: yang sudah pindah dilewati.
 *
 * Menjalankan (di VPS, container backend):
 *   docker exec paskatema_api node dist/src/scripts/migrate-uploads-to-cloudinary.js --dry-run
 *   docker exec paskatema_api node dist/src/scripts/migrate-uploads-to-cloudinary.js
 */
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { join, normalize, sep } from 'path';

import { StorageService, resourceTypeFor } from '../storage/storage.service';

const LOCAL_URL_PREFIX = '/api/uploads/';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const storage = new StorageService();
  if (!storage.cloudinaryEnabled) {
    throw new Error(
      'Kredensial Cloudinary belum di-set (CLOUDINARY_URL di .env). Batal.',
    );
  }

  const prisma = new PrismaClient();
  const uploadsDir = join(process.cwd(), 'uploads');

  try {
    const media = await prisma.media.findMany({
      where: {
        publicId: null,
        url: { contains: LOCAL_URL_PREFIX },
        OR: [
          { mimeType: { startsWith: 'image/' } },
          { mimeType: { startsWith: 'video/' } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(
      `${media.length} file lokal akan dipindahkan${dryRun ? ' (dry run)' : ''}.`,
    );
    let moved = 0;
    let missing = 0;
    let failed = 0;

    for (const item of media) {
      const relative = item.url.slice(
        item.url.indexOf(LOCAL_URL_PREFIX) + LOCAL_URL_PREFIX.length,
      );
      const path = normalize(join(uploadsDir, relative));
      if (!path.startsWith(uploadsDir + sep) || !existsSync(path)) {
        missing += 1;
        console.warn(`  [hilang] ${item.id} ${item.url}`);
        continue;
      }

      const resourceType = resourceTypeFor(item.mimeType);
      // Subfolder Cloudinary mengikuti folder lokal (mis. avatars/), default media/video.
      const subfolder = relative.includes('/')
        ? relative.split('/')[0]
        : resourceType === 'video'
          ? 'video'
          : 'media';

      if (dryRun) {
        console.log(`  [akan dipindah] ${relative} -> ${subfolder}/`);
        continue;
      }

      try {
        const stored = await storage.uploadPath(path, subfolder, resourceType);
        await prisma.media.update({
          where: { id: item.id },
          data: { url: stored.url, publicId: stored.publicId },
        });
        moved += 1;
        console.log(`  [ok] ${relative} -> ${stored.url}`);
      } catch (error) {
        failed += 1;
        console.error(`  [gagal] ${relative}: ${String(error)}`);
      }
    }

    console.log(
      `Selesai. Dipindahkan: ${moved}, file hilang: ${missing}, gagal: ${failed}.`,
    );
    if (failed > 0) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
