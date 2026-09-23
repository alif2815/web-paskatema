import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import type { Response } from 'express';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Di belakang reverse proxy (Traefik), tanpa ini req.protocol selalu
  // terbaca "http" (koneksi internal Traefik->container memang HTTP polos),
  // padahal koneksi asli client ke Traefik sudah HTTPS. Wajib di-set supaya
  // Express membaca X-Forwarded-Proto/X-Forwarded-For dari Traefik.
  app.set('trust proxy', 1);

  // Semua file di-upload ke folder relatif terhadap current working
  // directory (lihat multer.config.ts, document-multer.config.ts,
  // user.service.ts), BUKAN relatif terhadap __dirname (yang menunjuk ke
  // dist/src saat production build). Pakai process.cwd() di sini supaya
  // path yang di-serve selalu konsisten dengan path tempat file ditulis.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    // Cegah browser menebak tipe konten file upload (mis. jalankan sebagai HTML).
    setHeaders: (res: Response) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });

  const config = new DocumentBuilder()
    .setTitle('PASKATEMA API')
    .setDescription('Backend API untuk website PASKATEMA')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Dipasang di "docs" (bukan "api") karena "/api" di domain publik kini
  // dipakai Traefik sebagai path-prefix untuk routing ke backend ini
  // (lihat docker-compose.yml) — diakses publik lewat /api/docs.
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
