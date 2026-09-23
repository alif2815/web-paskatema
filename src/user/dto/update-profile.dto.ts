import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
    description:
      'ID media avatar (UUID dari tabel Media). Isi setelah upload via POST /user/me/avatar',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  avatarId?: string;

  @ApiProperty({
    description: 'Nomor angkatan/generasi anggota',
    example: 32,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number;
}

/**
 * Profil yang boleh diubah user sendiri (PATCH /user/me). `angkatan` sengaja
 * dikecualikan: field itu menentukan siapa yang tampil di direktori publik
 * /anggota, jadi hanya admin (PATCH /user/:id) yang boleh mengubahnya.
 */
export class UpdateOwnProfileDto extends OmitType(UpdateProfileDto, [
  'angkatan',
] as const) {}
