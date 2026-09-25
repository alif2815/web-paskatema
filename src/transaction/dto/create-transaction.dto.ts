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
  MaxLength,
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
    description: 'Jumlah barang/jasa (opsional)',
    example: 10,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number | null;

  @ApiProperty({
    description: 'Satuan jumlah, mis. pcs, dus, paket (opsional)',
    example: 'pcs',
    required: false,
  })
  @IsString()
  @MaxLength(30)
  @IsOptional()
  unit?: string | null;

  @ApiProperty({
    description:
      'Harga satuan dalam Rupiah (opsional). Jika jumlah & harga diisi, nominal = jumlah × harga',
    example: 15000,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  unitPrice?: number | null;

  @ApiProperty({
    description: 'Nama vendor/toko (opsional)',
    example: 'Toko Sumber Rejeki',
    required: false,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  vendorName?: string | null;

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
