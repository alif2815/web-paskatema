import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({
    example: 'PASKATEMA Raih Juara 1 Lomba PBB Tingkat Kota Malang',
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

  @ApiProperty({
    example: 'uuid-user-admin',
  })
  @IsUUID()
  @IsNotEmpty()
  authorId!: string;

  @ApiPropertyOptional({
    example: 'uuid-media-cover',
  })
  @IsOptional()
  @IsUUID()
  coverId?: string;
}