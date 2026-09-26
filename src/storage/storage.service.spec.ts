/* eslint-disable @typescript-eslint/no-unsafe-return -- jest.mock factory forwards untyped mock calls */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const upload = jest.fn();
const destroy = jest.fn();
const uploadStream = jest.fn();
const uploadLarge = jest.fn();
const config = jest.fn();

jest.mock('cloudinary', () => ({
  v2: {
    config: (...args: unknown[]) => config(...args),
    uploader: {
      upload: (...args: unknown[]) => upload(...args),
      destroy: (...args: unknown[]) => destroy(...args),
      upload_stream: (...args: unknown[]) => uploadStream(...args),
      upload_large: (...args: unknown[]) => uploadLarge(...args),
    },
  },
}));

import { StorageService } from './storage.service';

const CLOUDINARY_ENV = [
  'CLOUDINARY_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLOUDINARY_FOLDER',
] as const;

describe('StorageService', () => {
  let cwd: string;
  let tmp: string;

  beforeEach(() => {
    jest.clearAllMocks();
    CLOUDINARY_ENV.forEach((key) => delete process.env[key]);
    tmp = mkdtempSync(join(tmpdir(), 'storage-'));
    cwd = process.cwd();
    process.chdir(tmp);
    mkdirSync(join(tmp, 'uploads'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(cwd);
    rmSync(tmp, { recursive: true, force: true });
    CLOUDINARY_ENV.forEach((key) => delete process.env[key]);
  });

  describe('local mode (no Cloudinary credentials)', () => {
    it('is disabled and keeps the disk file with a local URL', async () => {
      const service = new StorageService();
      expect(service.cloudinaryEnabled).toBe(false);

      const result = await service.saveDiskFile(
        {
          filename: 'a.jpg',
          path: join(tmp, 'uploads', 'a.jpg'),
        } as Express.Multer.File,
        'https://paskatema.test',
        'media',
      );

      expect(result).toEqual({
        url: 'https://paskatema.test/api/uploads/a.jpg',
        publicId: null,
      });
      expect(upload).not.toHaveBeenCalled();
    });

    it('writes avatar buffers under uploads/avatars and can remove them', async () => {
      const service = new StorageService();
      const stored = await service.saveBuffer(Buffer.from('x'), {
        subfolder: 'avatars',
        baseName: 'avatar-1',
        extension: '.png',
      });

      expect(stored.url).toBe('/api/uploads/avatars/avatar-1.png');
      const file = join(tmp, 'uploads', 'avatars', 'avatar-1.png');
      expect(existsSync(file)).toBe(true);

      await service.remove(stored);
      expect(existsSync(file)).toBe(false);
    });

    it('ignores path traversal in stored URLs when removing', async () => {
      const service = new StorageService();
      const outside = join(tmp, 'secret.txt');
      writeFileSync(outside, 'keep');

      await service.remove({
        url: '/api/uploads/../secret.txt',
        publicId: null,
      });

      expect(existsSync(outside)).toBe(true);
    });
  });

  describe('Cloudinary mode', () => {
    beforeEach(() => {
      process.env.CLOUDINARY_URL = 'cloudinary://key:secret@demo';
    });

    it('uploads the disk file, returns an optimized URL and deletes the temp file', async () => {
      const temp = join(tmp, 'uploads', 'b.jpg');
      writeFileSync(temp, 'img');
      upload.mockResolvedValue({
        secure_url:
          'https://res.cloudinary.com/demo/image/upload/v1/paskatema/media/b.jpg',
        public_id: 'paskatema/media/b',
      });

      const service = new StorageService();
      expect(service.cloudinaryEnabled).toBe(true);

      const result = await service.saveDiskFile(
        { filename: 'b.jpg', path: temp } as Express.Multer.File,
        'https://paskatema.test',
        'media',
      );

      expect(upload).toHaveBeenCalledWith(
        temp,
        expect.objectContaining({ folder: 'paskatema/media' }),
      );
      expect(result.publicId).toBe('paskatema/media/b');
      expect(result.url).toContain('/upload/f_auto,q_auto/');
      expect(existsSync(temp)).toBe(false);
    });

    it('deletes the temp file even when the upload fails', async () => {
      const temp = join(tmp, 'uploads', 'c.jpg');
      writeFileSync(temp, 'img');
      upload.mockRejectedValue(new Error('boom'));

      const service = new StorageService();

      await expect(
        service.saveDiskFile(
          { filename: 'c.jpg', path: temp } as Express.Multer.File,
          '',
          'media',
        ),
      ).rejects.toThrow('boom');
      expect(existsSync(temp)).toBe(false);
    });

    it('streams avatar buffers to Cloudinary with the given public id', async () => {
      uploadStream.mockImplementation(
        (
          _opts: unknown,
          cb: (
            err: unknown,
            res: { secure_url: string; public_id: string },
          ) => void,
        ) => ({
          end: () =>
            cb(null, {
              secure_url:
                'https://res.cloudinary.com/demo/image/upload/v1/paskatema/avatars/avatar-1',
              public_id: 'paskatema/avatars/avatar-1',
            }),
        }),
      );

      const service = new StorageService();
      const result = await service.saveBuffer(Buffer.from('x'), {
        subfolder: 'avatars',
        baseName: 'avatar-1',
        extension: '.png',
      });

      expect(uploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          public_id: 'avatar-1',
          folder: 'paskatema/avatars',
        }),
        expect.any(Function),
      );
      expect(result.publicId).toBe('paskatema/avatars/avatar-1');
    });

    it('destroys by public id and never throws on failure', async () => {
      destroy.mockRejectedValue(new Error('network'));
      const service = new StorageService();

      await expect(
        service.remove({ url: 'https://x/y', publicId: 'paskatema/media/b' }),
      ).resolves.toBeUndefined();
      expect(destroy).toHaveBeenCalledWith('paskatema/media/b', {
        resource_type: 'image',
        invalidate: true,
      });
    });

    it('uploads videos with upload_large and deletes them as video', async () => {
      const temp = join(tmp, 'uploads', 'v.mp4');
      writeFileSync(temp, 'vid');
      uploadLarge.mockImplementation(
        (_path: string, _opts: unknown, cb: (e: unknown, r: unknown) => void) =>
          cb(undefined, {
            secure_url:
              'https://res.cloudinary.com/demo/video/upload/v1/paskatema/video/v.mp4',
            public_id: 'paskatema/video/v',
          }),
      );
      const service = new StorageService();

      const result = await service.saveDiskFile(
        {
          filename: 'v.mp4',
          path: temp,
          mimetype: 'video/mp4',
        } as Express.Multer.File,
        'https://paskatema.test',
        'video',
      );
      expect(uploadLarge).toHaveBeenCalledWith(
        temp,
        expect.objectContaining({
          folder: 'paskatema/video',
          resource_type: 'video',
        }),
        expect.any(Function),
      );
      expect(upload).not.toHaveBeenCalled();
      expect(result.publicId).toBe('paskatema/video/v');
      expect(existsSync(temp)).toBe(false);

      destroy.mockResolvedValue({});
      await service.remove({ ...result, mimeType: 'video/mp4' });
      expect(destroy).toHaveBeenCalledWith('paskatema/video/v', {
        resource_type: 'video',
        invalidate: true,
      });
    });

    it('accepts separate key env vars instead of CLOUDINARY_URL', () => {
      delete process.env.CLOUDINARY_URL;
      process.env.CLOUDINARY_CLOUD_NAME = 'demo';
      process.env.CLOUDINARY_API_KEY = 'k';
      process.env.CLOUDINARY_API_SECRET = 's';

      const service = new StorageService();

      expect(service.cloudinaryEnabled).toBe(true);
      expect(config).toHaveBeenCalledWith({
        cloud_name: 'demo',
        api_key: 'k',
        api_secret: 's',
      });
    });
  });
});
