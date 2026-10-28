import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateEmailDto {
  @ApiProperty({
    description:
      'Email address baru. Admin wajib menggunakan domain @paskatema.com',
    example: 'user@gmail.com',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description:
      'Password saat ini, untuk memastikan yang mengganti email adalah pemilik akun',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
