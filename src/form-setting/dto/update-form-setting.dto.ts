import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateFormSettingDto {
  @ApiPropertyOptional({
    description:
      'Judul form pendaftaran',
    example:
      'Pendaftaran Anggota PASKATEMA 2026/2027',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Status aktif form',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Daftar pertanyaan/field dinamis pada form',
    example: [
      {
        key: 'nama_lengkap',
        label: 'Nama Lengkap',
        type: 'text',
        required: true,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  schema?: Record<string, unknown>[];
}