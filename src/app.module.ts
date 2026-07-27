import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MediaModule } from './media/media.module';
import { NewsModule } from './news/news.module';
import { EventModule } from './event/event.module';
import { EbookModule } from './ebook/ebook.module';
import { ShortLinkModule } from './short-link/short-link.module';
import { VotingModule } from './voting/voting.module';
import { AchievementModule } from './achievement/achievement.module';
import { PeriodModule } from './period/period.module';
import { PositionModule } from './position/position.module';
import { StructureModule } from './structure/structure.module';
import { FormSettingModule } from './form-setting/form-setting.module';
import { RegistrationModule } from './registration/registration.module';
import { EbookModule } from './ebook/ebook.module';

@Module({
  imports: [AuthModule, UserModule, MediaModule, NewsModule, EventModule, EbookModule, AchievementModule, PeriodModule, PositionModule, StructureModule, FormSettingModule, RegistrationModule, VotingModule, ShortLinkModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
