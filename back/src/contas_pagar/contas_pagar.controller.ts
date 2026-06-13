import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseGuards, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ContasPagarService } from './contas_pagar.service';
import { CreateContasPagarDto } from './dto/create-contas_pagar.dto';
import { UpdateContasPagarDto } from './dto/update-contas_pagar.dto';
import { FilterContasPagarDto } from './dto/filter-contas-pagar.dto';
import { RegistrarPagamentoDto } from './dto/registrar-pagamento.dto';
import { CategoriaDespesa } from './entities/categoria-despesa.entity';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('contas-pagar')
@UseGuards(JwtAuthGuard)
export class ContasPagarController {
  constructor(private readonly contasPagarService: ContasPagarService) {}

  // ─── CRUD ──────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateContasPagarDto) {
    return this.contasPagarService.create(dto);
  }

  @Get()
  findAll(@Query() filter: FilterContasPagarDto) {
    return this.contasPagarService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contasPagarService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContasPagarDto) {
    return this.contasPagarService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.contasPagarService.remove(id);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.contasPagarService.cancelar(id);
  }

  // ─── PAGAMENTOS ────────────────────────────────────────────────

  @Post(':id/pagamentos')
  @HttpCode(HttpStatus.CREATED)
  registrarPagamento(
    @Param('id') id: string,
    @Body() dto: RegistrarPagamentoDto,
  ) {
    return this.contasPagarService.registrarPagamento(id, dto);
  }

  @Delete(':id/pagamentos/:pagamentoId/estornar')
  estornarPagamento(
    @Param('id') contaId: string,
    @Param('pagamentoId') pagamentoId: string,
  ) {
    return this.contasPagarService.estornarPagamento(contaId, pagamentoId);
  }

  // ─── RECORRÊNCIA ───────────────────────────────────────────────

  @Post(':id/gerar-proxima')
  gerarProximaRecorrencia(@Param('id') id: string) {
    return this.contasPagarService.gerarProximaRecorrencia(id);
  }

  // ─── UTILITÁRIOS ───────────────────────────────────────────────

  @Post('sistema/atualizar-vencidos')
  @HttpCode(HttpStatus.OK)
  atualizarVencidos() {
    return this.contasPagarService.atualizarVencidos();
  }

  // ─── DASHBOARD / RELATÓRIOS ────────────────────────────────────

  @Get('dashboard/resumo')
  getDashboard(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.contasPagarService.getDashboard(mes, ano);
  }

  @Get('relatorios/periodo')
  getRelatorioPorPeriodo(
    @Query('de') de: string,
    @Query('ate') ate: string,
  ) {
    return this.contasPagarService.getRelatorioPorPeriodo(de, ate);
  }

  // ─── CATEGORIAS ────────────────────────────────────────────────

  @Get('categorias/listar')
  findAllCategorias() {
    return this.contasPagarService.findAllCategorias();
  }

  @Post('categorias')
  @HttpCode(HttpStatus.CREATED)
  createCategoria(@Body() dto: Partial<CategoriaDespesa>) {
    return this.contasPagarService.createCategoria(dto);
  }
}