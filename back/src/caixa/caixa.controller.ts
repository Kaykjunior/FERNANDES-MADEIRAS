import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CaixaService } from './caixa.service';
import { CreateCaixaDto } from './dto/create-caixa.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('caixa')
export class CaixaController {
  constructor(private readonly service: CaixaService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDto: CreateCaixaDto) {
    return this.service.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}