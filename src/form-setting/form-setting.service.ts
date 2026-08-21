import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFormSettingDto } from './dto/create-form-setting.dto';
import { UpdateFormSettingDto } from './dto/update-form-setting.dto';

@Injectable()
export class FormSettingService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createFormSettingDto: CreateFormSettingDto) {
        const existing = await this.prisma.formSetting.findFirst();
        if (existing) {
            throw new Error('Form setting sudah ada. Gunakan update jika ingin mengubah.');
        }

        return this.prisma.formSetting.create({ data: createFormSettingDto });
    }

    async findAll() {
        return this.prisma.formSetting.findMany();
    }

    async findOne(id: string) {
        return this.prisma.formSetting.findUnique({ where: { id } });
    }

    async update(id: string, updateFormSettingDto: UpdateFormSettingDto) {
        return this.prisma.formSetting.update({
            where: { id },
            data: updateFormSettingDto,
        });
    }

    async remove(id: string) {
        return this.prisma.formSetting.delete({ where: { id } });
    }

    // Untuk logic open/close form (menggunakan field isActive sesuai schema)
    async toggleFormStatus(id: string, isActive: boolean) {
        return this.prisma.formSetting.update({
            where: { id },
            data: { isActive },
        });
    }
}
