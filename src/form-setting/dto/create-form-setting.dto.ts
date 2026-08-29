import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFormSettingDto {
  @ApiProperty({
    description: 'Judul form pendaftaran',
    example: 'Pendaftaran Anggota PASKATEMA 2026/2027',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: 'Status aktif form',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Daftar pertanyaan/field dinamis yang digunakan oleh form',
    example: [
      {
        key: 'nama_lengkap',
        label: 'Nama Lengkap',
        type: 'text',
        required: true,
      },

      {
        key: 'nis',
        label: 'Nomer Induk Siswa',
        type: 'text',
        required: true,
      },
      {
        key: 'kelas',
        label: 'Kelas',
        type: 'select',
        required: true,
        options: ['X RPL 1', 'X RPL 2'], //kelas e berapa aja yo lupa
      },
      {
        key: 'motivasi',
        label: 'Motivasi Bergabung Bersama PASKATEMA',
        type: 'textarea',
        required: true,
      },
      {
        key: 'harapan',
        label: 'Harapan Bersama PASKATEMA',
        type: 'textarea',
        required: true,
      },
      {
        key: 'cv',
        label: 'CV / Portofolio',
        type: 'file',
        accept: ['application/pdf'],
        required: true,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty()
  schema!: Record<string, unknown>[];
}
