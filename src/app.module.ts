import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { createKeyv } from '@keyv/redis';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { buildRedisUrl } from './config/redis.util';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MediaModule } from './media/media.module';
import { NewsModule } from './news/news.module';
import { EventModule } from './event/event.module';
import { EbookModule } from './ebook/ebook.module';
import { PeriodModule } from './period/period.module';
import { PositionModule } from './position/position.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShortLinkModule } from './short-link/short-link.module';
import { VotingModule } from './voting/voting.module';
import { AchievementModule } from './achievement/achievement.module';
import { GalleryModule } from './gallery/gallery.module';
import { StructureModule } from './structure/structure.module';
import { RegistrationModule } from './registration/registration.module';
import { FormSettingModule } from './form-setting/form-setting.module';
import { TransactionModule } from './transaction/transaction.module';

/**
 * Validasi environment variable wajib saat startup. Gagal cepat (throw)
 * daripada membiarkan modul lain diam-diam jatuh ke nilai default yang
 * tidak aman (misalnya JWT secret hardcoded di source code).
 */
function validateEnv(config: Record<string, unknown>) {
  const jwtSecret = config.JWT_SECRET;

  if (typeof jwtSecret !== 'string' || jwtSecret.trim().length < 16) {
    throw new Error(
      'JWT_SECRET wajib di-set sebagai environment variable (minimal 16 karakter). ' +
        'Aplikasi tidak akan berjalan tanpa secret yang valid, demi mencegah ' +
        'penandatanganan token JWT dengan nilai default yang dapat ditebak.',
    );
  }

  if (
    typeof config.REDIS_HOST !== 'string' ||
    config.REDIS_HOST.trim() === ''
  ) {
    throw new Error(
      'REDIS_HOST wajib di-set sebagai environment variable. Redis dipakai ' +
        'untuk cache response publik dan storage rate-limiting endpoint auth.',
    );
  }

  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Cache response GET publik (news/event/achievement/ebook/dll) di Redis
    // supaya query DB berkurang untuk halaman yang sering diakses pengunjung.
    // Endpoint yang di-cache ditandai eksplisit lewat @UseInterceptors(CacheInterceptor)
    // per controller — module ini cuma menyediakan store-nya secara global.
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [createKeyv(buildRedisUrl(config))],
        ttl: 60_000, // default 60 detik, endpoint tertentu bisa override via @CacheTTL()
      }),
    }),
    // Rate-limiting berbasis Redis (bukan in-memory) supaya limit tetap
    // konsisten walau backend di-scale jadi >1 instance. Baseline global
    // dibuat longgar (120 req/menit); endpoint sensitif seperti login &
    // register di-override lebih ketat lewat @Throttle() di controller-nya.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
        storage: new ThrottlerStorageRedisService(buildRedisUrl(config)),
      }),
    }),
    AuthModule,
    UserModule,
    MediaModule,
    NewsModule,
    EventModule,
    EbookModule,
    AchievementModule,
    GalleryModule,
    PeriodModule,
    PositionModule,
    StructureModule,
    FormSettingModule,
    RegistrationModule,
    VotingModule,
    ShortLinkModule,
    TransactionModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
