import { Injectable } from '@nestjs/common';
import { CreateConfiguracoesFiscaisCfopDto } from './dto/create-configuracoes_fiscais_cfop.dto';
import { UpdateConfiguracoesFiscaisCfopDto } from './dto/update-configuracoes_fiscais_cfop.dto';

@Injectable()
export class ConfiguracoesFiscaisCfopService {
  create(createConfiguracoesFiscaisCfopDto: CreateConfiguracoesFiscaisCfopDto) {
    return 'This action adds a new configuracoesFiscaisCfop';
  }

  findAll() {
    return `This action returns all configuracoesFiscaisCfop`;
  }

  findOne(id: number) {
    return `This action returns a #${id} configuracoesFiscaisCfop`;
  }

  update(id: number, updateConfiguracoesFiscaisCfopDto: UpdateConfiguracoesFiscaisCfopDto) {
    return `This action updates a #${id} configuracoesFiscaisCfop`;
  }

  remove(id: number) {
    return `This action removes a #${id} configuracoesFiscaisCfop`;
  }
}
