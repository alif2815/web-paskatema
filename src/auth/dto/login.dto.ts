import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginAuthDto {
    @ApiProperty({
        description: "Email Address",
        example: "[EMAIL_ADDRESS]"
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: "Password",
        example: "[PASSWORD]"
    })
    @MinLength(8)
    password: string;
}
