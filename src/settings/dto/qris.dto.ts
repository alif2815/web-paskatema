import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateQrisDto {
  @ApiProperty({
    description:
      'Isi (payload) QRIS statis, diawali "000201". Kosong/null = hapus QRIS.',
    nullable: true,
  })
  @Transform(trim)
  @IsString()
  @MaxLength(512)
  @IsOptional()
  payload!: string | null;

  @ApiProperty({
    example: 'Untuk iuran kas dan donasi kegiatan',
    required: false,
  })
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  @IsOptional()
  note?: string;
}
