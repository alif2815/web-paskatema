import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser, Roles } from '../auth/decorators/get-user.decorators';

@ApiTags('Transaction')
// Pencatatan kas hanya oleh bendahara; admin cukup bisa melihat laporan.
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BENDAHARA)
  @ApiOperation({ summary: 'Bendahara: Catat transaksi kas baru' })
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @GetUser('id') userId: string,
  ) {
    return this.transactionService.create(createTransactionDto, userId);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.BENDAHARA)
  @ApiOperation({
    summary: 'Admin/Bendahara: Lihat daftar transaksi (filter & pagination)',
  })
  findAll(@Query() query: QueryTransactionDto) {
    return this.transactionService.findAll(query);
  }

  @Get('summary')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  @ApiOperation({
    summary:
      'Public: Ringkasan kas (total pemasukan/pengeluaran/saldo) untuk transparansi',
  })
  getSummary(@Query() query: QueryTransactionDto) {
    return this.transactionService.getSummary(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.BENDAHARA)
  @ApiOperation({ summary: 'Admin/Bendahara: Lihat detail transaksi' })
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BENDAHARA)
  @ApiOperation({ summary: 'Bendahara: Update transaksi' })
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BENDAHARA)
  @ApiOperation({ summary: 'Bendahara: Hapus transaksi' })
  remove(@Param('id') id: string) {
    return this.transactionService.remove(id);
  }
}
