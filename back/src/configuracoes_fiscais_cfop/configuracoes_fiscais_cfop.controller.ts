import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConfiguracoesFiscaisCfopService } from './configuracoes_fiscais_cfop.service';
import { CreateConfiguracoesFiscaisCfopDto } from './dto/create-configuracoes_fiscais_cfop.dto';
import { UpdateConfiguracoesFiscaisCfopDto } from './dto/update-configuracoes_fiscais_cfop.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('configuracoes-fiscais-cfop')
export class ConfiguracoesFiscaisCfopController {
  constructor(private readonly configuracoesFiscaisCfopService: ConfiguracoesFiscaisCfopService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createConfiguracoesFiscaisCfopDto: CreateConfiguracoesFiscaisCfopDto) {
    return this.configuracoesFiscaisCfopService.create(createConfiguracoesFiscaisCfopDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.configuracoesFiscaisCfopService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.configuracoesFiscaisCfopService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateConfiguracoesFiscaisCfopDto: UpdateConfiguracoesFiscaisCfopDto) {
    return this.configuracoesFiscaisCfopService.update(+id, updateConfiguracoesFiscaisCfopDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.configuracoesFiscaisCfopService.remove(+id);
  }
}
