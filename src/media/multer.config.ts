import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',

    filename: (
      _request: Express.Request,
      file: Express.Multer.File,
      callback: (
        error: Error | null,
        filename: string,
      ) => void,
    ) => {
      const extension = extname(file.originalname);

      callback(
        null,
        `${randomUUID()}${extension}`,
      );
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (
      error: Error | null,
      acceptFile: boolean,
    ) => void,
  ) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'File harus berupa JPG, PNG, atau WEBP',
        ),
        false,
      );
    }

    callback(null, true);
  },
};