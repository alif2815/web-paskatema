import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateActiveAngkatanDto {
  @ApiProperty({ example: [33, 34, 35] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(999, { each: true })
  angkatan!: number[];

  @ApiProperty({
    description:
      'Sekaligus perbarui status semua anggota: angkatan di daftar = Aktif, lainnya = Purna',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  applyStatus?: boolean;
}
