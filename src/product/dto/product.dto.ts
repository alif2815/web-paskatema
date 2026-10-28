import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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

export class CreateProductDto {
  @ApiProperty({ example: 'Kaos Paskatema 2026' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(3000)
  @IsOptional()
  description?: string | null;

  @ApiProperty({ example: 85000 })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(10_000_000)
  price!: number;

  @ApiPropertyOptional({
    description: 'Kosong/null = stok tidak dibatasi',
    example: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  @IsOptional()
  stock?: number | null;

  @ApiPropertyOptional({ example: ['S', 'M', 'L', 'XL'] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID Media foto produk' })
  @IsUUID()
  @IsOptional()
  imageId?: string | null;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
