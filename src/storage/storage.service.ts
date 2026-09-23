import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface StoredImage {
  /** URL publik gambar. */
  url: string;
  /** Public ID Cloudinary; null jika disimpan lokal. */
  publicId: string | null;
}

/** Bagian minimal dari record Media yang dibutuhkan untuk menghapus file. */
export interface StoredFileRef {
  url: string;
  publicId: string | null;
}

const LOCAL_URL_PREFIX = '/api/uploads/';

/**
 * Penyimpanan foto. Default: disk lokal (folder uploads/, di-serve lewat
 * /api/uploads). Jika kredensial Cloudinary di-set (CLOUDINARY_URL, atau
 * CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET), foto
 * baru otomatis diunggah ke Cloudinary. Foto lama yang sudah tersimpan lokal
 * tetap berfungsi — URL-nya tidak berubah.
 *
 * Hanya gambar yang lewat sini; PDF (E-Book) tetap disimpan lokal.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  readonly cloudinaryEnabled: boolean;

  constructor() {
    const env = process.env;
    const hasSeparateKeys =
      !!env.CLOUDINARY_CLOUD_NAME &&
      !!env.CLOUDINARY_API_KEY &&
      !!env.CLOUDINARY_API_SECRET;

    this.cloudinaryEnabled = !!env.CLOUDINARY_URL || hasSeparateKeys;

    if (this.cloudinaryEnabled) {
      // CLOUDINARY_URL dibaca otomatis oleh SDK; kunci terpisah di-set manual.
      if (!env.CLOUDINARY_URL) {
        cloudinary.config({
          cloud_name: env.CLOUDINARY_CLOUD_NAME,
          api_key: env.CLOUDINARY_API_KEY,
          api_secret: env.CLOUDINARY_API_SECRET,
        });
      }
      cloudinary.config({ secure: true });
      this.logger.log('Penyimpanan foto: Cloudinary');
    } else {
      this.logger.log('Penyimpanan foto: disk lokal (uploads/)');
    }
  }

  private get folder(): string {
    return process.env.CLOUDINARY_FOLDER ?? 'paskatema';
  }

  /**
   * Sisipkan transformasi f_auto,q_auto: Cloudinary memilih format & kualitas
   * terbaik per browser, sehingga foto besar dari anggota tidak membebani
   * halaman.
   */
  private optimizedUrl(secureUrl: string): string {
    return secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }

  /**
   * File hasil multer diskStorage (sudah ada di uploads/). Lokal: dibiarkan
   * di tempat. Cloudinary: diunggah lalu file lokalnya dihapus.
   */
  async saveDiskFile(
    file: Express.Multer.File,
    baseUrl: string,
    subfolder: string,
  ): Promise<StoredImage> {
    if (!this.cloudinaryEnabled) {
      return {
        url: `${baseUrl}${LOCAL_URL_PREFIX}${file.filename}`,
        publicId: null,
      };
    }

    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `${this.folder}/${subfolder}`,
        resource_type: 'image',
      });
      return {
        url: this.optimizedUrl(result.secure_url),
        publicId: result.public_id,
      };
    } finally {
      // File sementara tidak dibutuhkan lagi (sukses maupun gagal upload).
      await fs.rm(file.path, { force: true });
    }
  }

  /**
   * File dari memory (mis. avatar). `fileName` tanpa ekstensi dipakai sebagai
   * public ID di Cloudinary; lokal ditulis ke uploads/<subfolder>/<fileName+ext>.
   */
  async saveBuffer(
    buffer: Buffer,
    options: { subfolder: string; baseName: string; extension: string },
  ): Promise<StoredImage> {
    const { subfolder, baseName, extension } = options;

    if (!this.cloudinaryEnabled) {
      const dir = join(process.cwd(), 'uploads', subfolder);
      await fs.mkdir(dir, { recursive: true });
      const fileName = `${baseName}${extension}`;
      await fs.writeFile(join(dir, fileName), buffer);
      return {
        url: `${LOCAL_URL_PREFIX}${subfolder}/${fileName}`,
        publicId: null,
      };
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `${this.folder}/${subfolder}`,
            public_id: baseName,
            resource_type: 'image',
          },
          (error, uploaded) => {
            if (error || !uploaded) {
              reject(new Error(error?.message ?? 'Upload Cloudinary gagal'));
              return;
            }
            resolve(uploaded);
          },
        );
        stream.end(buffer);
      },
    );

    return {
      url: this.optimizedUrl(result.secure_url),
      publicId: result.public_id,
    };
  }

  /** Hapus file dari penyimpanan (best-effort: kegagalan hanya di-log). */
  async remove(ref: StoredFileRef): Promise<void> {
    try {
      if (ref.publicId) {
        await cloudinary.uploader.destroy(ref.publicId, {
          resource_type: 'image',
        });
        return;
      }

      // Lokal: URL publik "…/api/uploads/x" → path fisik "uploads/x".
      const marker = ref.url.indexOf(LOCAL_URL_PREFIX);
      if (marker === -1) {
        return;
      }
      const relative = ref.url.slice(marker + LOCAL_URL_PREFIX.length);
      if (relative.includes('..')) {
        return;
      }
      await fs.rm(join(process.cwd(), 'uploads', relative), { force: true });
    } catch (error) {
      this.logger.warn(`Gagal menghapus file ${ref.url}: ${String(error)}`);
    }
  }
}
