import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Nominal dasar (Rupiah); kode unik ditambahkan otomatis',
    example: 50000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(10_000_000)
  amount!: number;

  @ApiProperty({ example: 'Iuran kas Oktober' })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  description!: string;

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
