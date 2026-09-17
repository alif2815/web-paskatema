import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description:
      'Nominal transaksi dalam Rupiah (bilangan bulat, tanpa desimal)',
    example: 500000,
  })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Tanggal transaksi (format ISO 8601)',
    example: '2026-09-01',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Jenis transaksi',
    enum: TransactionType,
    example: TransactionType.INCOME,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Keterangan transaksi',
    example: 'Iuran anggota bulan September',
  })
  @IsString()
  @MinLength(3)
  description: string;

  @ApiProperty({
    description: 'ID periode kepengurusan terkait (opsional)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  periodId?: string;

  @ApiProperty({
    description: 'ID event terkait (opsional)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  eventId?: string;
}
