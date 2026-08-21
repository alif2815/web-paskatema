import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateFormSettingDto {
    @ApiProperty({
        description: "Judul form pendaftaran",
        example: "Form Pendaftaran Ketua OSIS 2025",
        required: false
    })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({
        description: "Status aktif form",
        example: true,
        required: false
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({
        description: "Schema form dalam format JSON",
        example: [{ "label": "Nama Lengkap", "type": "text", "required": true }],
        required: false
    })
    @IsOptional()
    schema?: object;
}