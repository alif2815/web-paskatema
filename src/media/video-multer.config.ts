import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';

const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

/** Batas 100 MB mengikuti batas ukuran video paket gratis Cloudinary. */
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export const videoMulterConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (
      _request: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const extension = VIDEO_EXTENSIONS[file.mimetype] ?? '.bin';
      callback(null, `${randomUUID()}${extension}`);
    },
  }),

  limits: { fileSize: VIDEO_MAX_BYTES },

  fileFilter: (
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!(file.mimetype in VIDEO_EXTENSIONS)) {
      return callback(
        new BadRequestException('Video harus berupa MP4, WEBM, atau MOV'),
        false,
      );
    }
    callback(null, true);
  },
};
