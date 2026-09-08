import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Password lama',
    example: 'OldPassword123',
  })
  @IsString()
  @MinLength(8)
  oldPassword: string;

  @ApiProperty({
    description: 'Password baru',
    example: 'NewPassword123',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    description: 'Konfirmasi password baru (harus sama dengan password baru)',
    example: 'NewPassword123',
  })
  @IsString()
  @MinLength(8)
  confirmNewPassword: string;
}
