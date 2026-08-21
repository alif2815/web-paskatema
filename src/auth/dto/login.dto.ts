import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginAuthDto {
  @ApiProperty({
    description: 'Email address',
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
}
