import {
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';

import { ShortLinkService } from './short-link.service';

@Controller('s')
export class RedirectController {
  constructor(
    private readonly shortLinkService: ShortLinkService,
  ) {}

  @Get(':code')
  async redirect(
    @Param('code') code: string,
    @Res() res: Response,
  ) {
    const result =
      await this.shortLinkService.redirect(code);

    return res.redirect(
      302,
      result.originalUrl,
    );
  }
}