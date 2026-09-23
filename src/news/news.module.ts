import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsFileService } from './news-file.service';

@Module({
  controllers: [NewsController],
  providers: [NewsService, NewsFileService],
})
export class NewsModule {}
