import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class CreateAuthDto {

    @ApiProperty({
        description: "Email address",
        example: "[EMAIL_ADDRESS]"
    })
    @IsEmail()
    @IsString()
    email: string;

    @ApiProperty({
        description: "Password",
        example: "[PASSWORD]"
    })
    @IsString()
    @MinLength(8)
    password: string;


    @ApiProperty({
        description: "Name",
        example: "John Doe"
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: "Phone number",
        example: "123456789"
    })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({
        description: "Bio",
        example: "Bio"
    })
    @IsString()
    @IsOptional()
    bio?: string;

    @ApiProperty({
        description: "Role",
        enum: Role,
        example: Role.USER
    })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;

}
