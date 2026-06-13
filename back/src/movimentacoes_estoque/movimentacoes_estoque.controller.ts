import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MovimentacoesEstoqueService } from './movimentacoes_estoque.service';
import { CreateMovimentacoesEstoqueDto } from './dto/create-movimentacoes_estoque.dto';
import { TipoMovimentacao } from './entities/movimentacoes_estoque.entity';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('movimentacoes-estoque')
export class MovimentacoesEstoqueController {
  constructor(private readonly movimentacoesEstoqueService: MovimentacoesEstoqueService) {}

  @Post()
  create(@Body() createMovimentacoesEstoqueDto: CreateMovimentacoesEstoqueDto) {
    return this.movimentacoesEstoqueService.create(createMovimentacoesEstoqueDto);
  }

  @Get()
  findAll(
    @Query('tipo') tipo?: TipoMovimentacao,
    @Query('produtoId') produtoId?: string,
    @Query('dataInicio') dataInicio?: Date,
    @Query('dataFim') dataFim?: Date,
    @Query('motivo') motivo?: string,
    @Query('usuarioId') usuarioId?: string,
  ) {
    return this.movimentacoesEstoqueService.findAll({
      tipo,
      produtoId,
      dataInicio,
      dataFim,
      motivo,
      usuarioId,
    });
  }

  @Get('resumo')
  @UseGuards(JwtAuthGuard)
  getResumo(@Query('periodo') periodo: 'HOJE' | '7_DIAS' | '30_DIAS' = '30_DIAS') {
    return this.movimentacoesEstoqueService.getResumoMovimentacoes(periodo);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.movimentacoesEstoqueService.findOne(id);
  }
}