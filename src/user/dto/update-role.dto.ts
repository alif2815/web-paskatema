import { PartialType } from '@nestjs/swagger';
import { UpdateProfileDto } from './update-profile.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateRoleDto extends PartialType(UpdateProfileDto) {
    @ApiProperty({
        description: "Role",
        enum: Role,
        example: Role.ADMIN
    })
    @IsEnum(Role)
    role: Role;
}
