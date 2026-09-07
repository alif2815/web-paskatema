import { Module } from '@nestjs/common';
import { FormSettingService } from './form-setting.service';
import { FormSettingController } from './form-setting.controller';

@Module({
  providers: [FormSettingService],
  controllers: [FormSettingController],
  exports: [FormSettingService],
})
export class FormSettingModule {}
