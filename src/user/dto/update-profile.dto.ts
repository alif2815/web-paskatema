import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Nama lengkap user',
    example: 'Budi Santoso',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Nomor telepon',
    example: '08123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Bio singkat user',
    example: 'Mahasiswa Teknik Informatika',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({
    description: 'ID media avatar (UUID dari tabel Media). Isi setelah upload via POST /user/me/avatar',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  avatarId?: string;
}
