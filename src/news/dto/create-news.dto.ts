import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({
    example:
      'PASKATEMA Raih Juara 1 Lomba PBB Tingkat Kota Malang',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example:
      'PASKATEMA berhasil meraih juara pertama dalam perlombaan PBB tingkat Kota Malang...',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    example:
      '68b26b8e-3f81-4c06-9d2f-74776885b37a',
    description: 'ID Media yang digunakan sebagai cover berita',
  })
  @IsOptional()
  @IsUUID()
  coverId?: string;
}