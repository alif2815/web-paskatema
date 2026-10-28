import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'sari@gmail.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token dari link di email' })
  @IsString()
  @Length(64, 64)
  token!: string;

  @ApiProperty({ example: 'PasswordBaru123' })
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiProperty({ example: 'PasswordBaru123' })
  @IsString()
  confirmNewPassword!: string;
}
