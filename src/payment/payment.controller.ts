import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';

import { PaymentService } from './payment.service';
import { CreatePaymentDto, QueryPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser, Roles } from '../auth/decorators/get-user.decorators';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';

@ApiTags('Pembayaran QRIS')
@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Public: buat pembayaran QRIS dengan kode unik' })
  create(
    @Body() dto: CreatePaymentDto,
    @Req() request: { user?: AuthenticatedUser | null },
  ) {
    return this.payments.create(dto, request.user ?? null);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BENDAHARA, Role.ADMIN)
  @ApiOperation({ summary: 'Bendahara/Admin: daftar pembayaran QRIS' })
  findAll(@Query() query: QueryPaymentDto) {
    return this.payments.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Public: status pembayaran (untuk pembayar)' })
  findPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.payments.findPublic(id);
  }

  @Patch(':id/confirm')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BENDAHARA)
  @ApiOperation({
    summary: 'Bendahara: konfirmasi lunas (otomatis jadi pemasukan)',
  })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.payments.confirm(id, user);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BENDAHARA)
  @ApiOperation({ summary: 'Bendahara: batalkan pembayaran' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.payments.cancel(id);
  }
}
