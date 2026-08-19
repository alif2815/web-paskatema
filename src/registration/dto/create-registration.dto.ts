import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateRegistrationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNumber()
    @IsOptional()
    phone: number;

    @IsString()
    @IsOptional()
    bio: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}