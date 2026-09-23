import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',

    filename: (
      _request: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      // Ekstensi dari mimetype yang divalidasi fileFilter, bukan dari nama
      // file buatan client.
      const extension = IMAGE_EXTENSIONS[file.mimetype] ?? '.bin';

      callback(null, `${randomUUID()}${extension}`);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException('File harus berupa JPG, PNG, atau WEBP'),
        false,
      );
    }

    callback(null, true);
  },
};
