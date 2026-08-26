import { Module } from '@nestjs/common';

import { ShortLinkController } from './short-link.controller';
import { RedirectController } from './redirect.controller';
import { ShortLinkService } from './short-link.service';

@Module({
  controllers: [
    ShortLinkController,
    RedirectController,
  ],
  providers: [ShortLinkService],
  exports: [ShortLinkService],
})
export class ShortLinkModule {}