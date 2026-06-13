import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FormasPagamentoService } from './formas_pagamento.service';
import { CreateFormasPagamentoDto } from './dto/create-formas_pagamento.dto';
import { UpdateFormasPagamentoDto } from './dto/update-formas_pagamento.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('formas-pagamento')
export class FormasPagamentoController {
  constructor(private readonly service: FormasPagamentoService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDto: CreateFormasPagamentoDto) {
    return this.service.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateFormasPagamentoDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}