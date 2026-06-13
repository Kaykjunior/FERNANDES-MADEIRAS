import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { LicitacoesService } from './Licitacoes.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import {
  CreateLicitacaoDto, UpdateLanceDto, FinalizarLicitacaoDto,
} from './dto/Create licitacao.dto';
import { StatusLicitacao } from './entities/Licitacao.entity';

@Controller('licitacoes')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class LicitacoesController {
  constructor(private readonly licitacoesService: LicitacoesService) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateLicitacaoDto) {
    return this.licitacoesService.create(dto);
  }

  @Get()
  findAll() {
    return this.licitacoesService.findAll();
  }

  /** Retorna a licitação com todos os cálculos de rateio e margens */
  @Get(':id/calcular')
  calcular(@Param('id') id: string) {
    return this.licitacoesService.calcular(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.licitacoesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateLicitacaoDto) {
    return this.licitacoesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.licitacoesService.remove(id);
  }

  // ── STATUS ────────────────────────────────────────────────────────────────

  @Put(':id/iniciar-pregao')
  iniciarPregao(@Param('id') id: string) {
    return this.licitacoesService.atualizarStatus(id, StatusLicitacao.EM_PREGAO);
  }

  @Put(':id/finalizar')
  finalizar(@Param('id') id: string, @Body() dto: FinalizarLicitacaoDto) {
    return this.licitacoesService.finalizar(id, dto);
  }

  @Put(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.licitacoesService.atualizarStatus(id, StatusLicitacao.CANCELADA);
  }

  // ── PREGÃO — lances por lote ─────────────────────────────────────────────

  @Patch('lotes/:loteId/lance')
  updateLance(
    @Param('loteId') loteId: string,
    @Body() dto: UpdateLanceDto,
  ) {
    return this.licitacoesService.updateLance(loteId, dto);
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────

  @Get('_/dashboard')
  getDashboard() {
    return this.licitacoesService.getDashboard();
  }
}