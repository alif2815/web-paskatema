import { Injectable } from '@nestjs/common';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { UpdateShortLinkDto } from './dto/update-short-link.dto';

@Injectable()
export class ShortLinkService {
  create(createShortLinkDto: CreateShortLinkDto) {
    return 'This action adds a new shortLink';
  }

  findAll() {
    return `This action returns all shortLink`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shortLink`;
  }

  update(id: number, updateShortLinkDto: UpdateShortLinkDto) {
    return `This action updates a #${id} shortLink`;
  }

  remove(id: number) {
    return `This action removes a #${id} shortLink`;
  }
}
