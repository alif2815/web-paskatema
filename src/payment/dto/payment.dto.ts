import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePaymentDto {
  @ApiPropertyOptional({
    description:
      'Nominal dasar (Rupiah); kode unik ditambahkan otomatis. Diabaikan untuk pembelian merchandise (dihitung dari harga).',
    example: 50000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(10_000_000)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    example: 'Iuran kas Oktober',
    description: 'Wajib bila bukan pembelian merchandise',
  })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Pembelian merchandise: ID produk' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 'L' })
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  @IsOptional()
  productOption?: string;

  @ApiProperty({ example: 'Sari Dewi' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  payerName!: string;

  @ApiPropertyOptional({ example: '0812xxxx / Angkatan 34' })
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  payerContact?: string;
}

export class QueryPaymentDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;
}
