// src/contas_receber/contas_receber.controller.ts
import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContasReceberService } from './contas_receber.service';
import { LiquidarContaDto } from './dto/liquidar-conta.dto';
import { UpdateContaDto } from './dto/update-contas_receber.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('contas-receber')
export class ContasReceberController {
  constructor(private readonly service: ContasReceberService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('status') status?: string,
    @Query('clienteId') clienteId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.service.findAll({
      status: status as any,
      clienteId,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    });
  }

  @Get('resumo')
  @UseGuards(JwtAuthGuard)
  getResumo() {
    return this.service.getResumo();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id/liquidar')
  @UseGuards(JwtAuthGuard)
  liquidar(@Param('id') id: string, @Body() dto: LiquidarContaDto) {
    return this.service.liquidar(id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateContaDto) {
    return this.service.update(id, dto);
  }
}