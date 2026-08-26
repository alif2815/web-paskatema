import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

export const documentMulterConfig = {
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
      const extension = extname(
        file.originalname,
      );

      callback(
        null,
        `${randomUUID()}${extension}`,
      );
    },
  }),

  limits: {
    // PDF materi diklat boleh lebih besar
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: (
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (
      error: Error | null,
      acceptFile: boolean,
    ) => void,
  ) => {
    if (file.mimetype !== 'application/pdf') {
      return callback(
        new BadRequestException(
          'File EBook harus berupa PDF',
        ),
        false,
      );
    }

    callback(null, true);
  },
};