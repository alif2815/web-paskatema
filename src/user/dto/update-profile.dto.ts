import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateProfileDto {
    @ApiProperty({
        description: "Name",
        example: "John Doe"
    })
    @IsString()
    @IsOptional()
    name: string;

    @ApiProperty({
        description: "Phone",
        example: "08123456789"
    })
    @IsString()
    @IsOptional()
    phone: string;

    @ApiProperty({
        description: "Bio",
        example: "Bio"
    })
    @IsString()
    @IsOptional()
    bio: string;
}
