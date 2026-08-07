import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateFormSettingDto {
    @ApiProperty({
        description: "Judul form pendaftaran",
        example: "Form Pendaftaran Ketua OSIS 2025"
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: "Status aktif form",
        example: false,
        required: false,
        default: false
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({
        description: "Schema form dalam format JSON (daftar pertanyaan/field form)",
        example: [{ "label": "Nama Lengkap", "type": "text", "required": true }]
    })
    @IsNotEmpty()
    schema: object;
}