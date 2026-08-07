import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class UpdateEmailDto {
    @ApiProperty({
        description: "Email Address",
        example: "[EMAIL_ADDRESS]"
    })
    @IsEmail()
    email: string;

}