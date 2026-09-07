import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Role baru yang akan ditetapkan ke user',
    enum: Role,
    example: Role.ADMIN,
  })
  @IsEnum(Role)
  role: Role;
}
