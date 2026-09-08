import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({
    description:
      'Email address. Role ditentukan otomatis oleh server dari domain email (@paskatema.com -> ADMIN, selain itu -> USER); field ini tidak menerima role dari client.',
    example: 'user@gmail.com',
  })
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Password minimal 8 karakter',
    example: 'Password123',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Nama lengkap',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Nomor telepon (opsional)',
    example: '08123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Bio singkat (opsional)',
    example: 'Saya adalah pengguna baru',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;
}
