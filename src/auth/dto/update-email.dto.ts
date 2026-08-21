import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateEmailDto {
  @ApiProperty({
    description: 'Email address baru. Admin wajib menggunakan domain @paskatema.com',
    example: 'user@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;
}