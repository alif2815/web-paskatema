import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MemberStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

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

  @ApiProperty({
    description: 'Status keanggotaan (khusus admin)',
    enum: MemberStatus,
    required: false,
  })
  @IsEnum(MemberStatus)
  @IsOptional()
  memberStatus?: MemberStatus;

  @ApiProperty({
    description: 'Pendidikan / kampus',
    example: 'Teknik Informatika, Universitas Brawijaya',
    required: false,
  })
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  @IsOptional()
  education?: string | null;

  @ApiProperty({
    description: 'Pekerjaan / instansi',
    example: 'Software Engineer di PT Telkom Indonesia',
    required: false,
  })
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  @IsOptional()
  occupation?: string | null;

  @ApiProperty({
    description: 'Keahlian (maks. 15, masing-masing maks. 40 karakter)',
    example: ['PBB', 'Desain Grafis'],
    required: false,
  })
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @IsOptional()
  skills?: string[];

  @ApiProperty({
    description: 'URL profil LinkedIn',
    example: 'https://www.linkedin.com/in/budi-santoso',
    required: false,
  })
  @Transform(trim)
  @Matches(/^(https:\/\/([a-z]{2,3}\.)?linkedin\.com\/[^\s]{1,200})?$/i, {
    message:
      'URL LinkedIn harus berawalan https://linkedin.com/ atau https://www.linkedin.com/',
  })
  @IsOptional()
  linkedinUrl?: string | null;

  @ApiProperty({
    description: 'Username Instagram (tanpa atau dengan @)',
    example: 'paskatema',
    required: false,
  })
  @Transform(trim)
  @Matches(/^(@?[A-Za-z0-9._]{1,30})?$/, {
    message: 'Username Instagram tidak valid',
  })
  @IsOptional()
  instagram?: string | null;

  @ApiProperty({
    description:
      'Tampilkan profil lengkap ke publik (hanya untuk anggota berstatus PURNA)',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  profilePublic?: boolean;
}

/** Ubah status keanggotaan satu angkatan sekaligus (khusus admin). */
export class BulkMemberStatusDto {
  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  angkatan!: number;

  @ApiProperty({ enum: MemberStatus, example: MemberStatus.PURNA })
  @IsEnum(MemberStatus)
  memberStatus!: MemberStatus;
}

/**
 * Profil yang boleh diubah user sendiri (PATCH /user/me). `angkatan` dan
 * `memberStatus` sengaja dikecualikan: keduanya menentukan siapa yang tampil
 * di direktori dan sebagai apa, jadi hanya admin (PATCH /user/:id) yang boleh
 * mengubahnya.
 */
export class UpdateOwnProfileDto extends OmitType(UpdateProfileDto, [
  'angkatan',
  'memberStatus',
] as const) {}
