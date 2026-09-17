import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class QueryTransactionDto {
  @ApiProperty({
    description: 'Filter berdasarkan jenis transaksi',
    enum: TransactionType,
    required: false,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiProperty({
    description: 'Filter berdasarkan periode kepengurusan',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  periodId?: string;

  @ApiProperty({
    description: 'Filter berdasarkan event terkait',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @ApiProperty({
    description: 'Tanggal mulai (inklusif, format ISO 8601)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({
    description: 'Tanggal akhir (inklusif, format ISO 8601)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiProperty({
    description: 'Halaman yang ingin ditampilkan (mulai dari 1)',
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Jumlah item per halaman',
    required: false,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
