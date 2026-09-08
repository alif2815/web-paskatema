import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { StructureModule } from './structure/structure.module';
import { RegistrationModule } from './registration/registration.module';
import { FormSettingModule } from './form-setting/form-setting.module';

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

  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    AuthModule,
    UserModule,
    MediaModule,
    NewsModule,
    EventModule,
    EbookModule,
    AchievementModule,
    PeriodModule,
    PositionModule,
    StructureModule,
    FormSettingModule,
    RegistrationModule,
    VotingModule,
    ShortLinkModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
