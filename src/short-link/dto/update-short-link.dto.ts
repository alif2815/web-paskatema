import { PartialType } from '@nestjs/swagger';
import { CreateShortLinkDto } from './create-short-link.dto';

export class UpdateShortLinkDto extends PartialType(CreateShortLinkDto) {}
