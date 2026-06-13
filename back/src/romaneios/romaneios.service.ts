import { Injectable } from '@nestjs/common';
import { CreateRomaneioDto } from './dto/create-romaneio.dto';
import { UpdateRomaneioDto } from './dto/update-romaneio.dto';

@Injectable()
export class RomaneiosService {
  create(createRomaneioDto: CreateRomaneioDto) {
    return 'This action adds a new romaneio';
  }

  findAll() {
    return `This action returns all romaneios`;
  }

  findOne(id: number) {
    return `This action returns a #${id} romaneio`;
  }

  update(id: number, updateRomaneioDto: UpdateRomaneioDto) {
    return `This action updates a #${id} romaneio`;
  }

  remove(id: number) {
    return `This action removes a #${id} romaneio`;
  }
}
