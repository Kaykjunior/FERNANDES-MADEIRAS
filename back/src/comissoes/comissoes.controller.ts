// src/comissoes/comissoes.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  HttpException
} from '@nestjs/common';
import { ComissoesService } from './comissoes.service';
import { CreateComissaoDto, LiberarComissaoDto, PagarComissaoDto, FiltrarComissoesDto } from './dto/create-comissoe.dto';
import { UpdateComissaoDto } from './dto/update-comissoe.dto';
import { ReciboPdfService } from './recibo-pdf.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/guards/roles.guard';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { UserRole } from '../usuario/entities/usuario.entity';
import { GerarReciboDto } from './dto/gerar-recibo.dto';

@Controller('comissoes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComissoesController {
  constructor(
    private readonly comissoesService: ComissoesService,
    private readonly reciboPdfService: ReciboPdfService,
  ) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  create(@Body() createComissaoDto: CreateComissaoDto) {
    return this.comissoesService.create(createComissaoDto);
  }

@Get()
  findAll(@Query() filtro: FiltrarComissoesDto) {
    // Se existir algum filtro (como status, vendedorId, etc), usa a busca filtrada
    if (Object.keys(filtro).length > 0) {
      console.log('🔎 Aplicando filtros em findAll:', filtro);
      return this.comissoesService.buscarComissoes(filtro);
    }
    
    // Se não houver filtro, retorna a listagem padrão
    return this.comissoesService.findAll();
  }

  /**
   * GET /comissoes/buscar?dataInicio=2026-02-01&dataFim=2026-02-27&vendedorId=...&status=...
   * 
   * CORREÇÃO: Agora retorna TODOS os status (PREVISTA, LIBERADA, PAGA) no período.
   * O filtro de data foi corrigido no service para usar a data da VENDA.
   */
  @Get('buscar')
  async buscar(@Query() filtro: any) {
    console.log('📥 Filtros recebidos em /buscar:', filtro);

    // Converter strings de data para Date
    if (filtro.dataInicio && typeof filtro.dataInicio === 'string') {
      filtro.dataInicio = new Date(filtro.dataInicio);
    }
    if (filtro.dataFim && typeof filtro.dataFim === 'string') {
      filtro.dataFim = new Date(filtro.dataFim);
    }

    return this.comissoesService.buscarComissoes(filtro);
  }

  @Get('relatorio')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.FINANCEIRO)
  async relatorio(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string
  ) {
    if (!dataInicio || !dataFim) {
      throw new HttpException('Data início e data fim são obrigatórias', HttpStatus.BAD_REQUEST);
    }
    return this.comissoesService.gerarRelatorioComissoes(
      new Date(dataInicio),
      new Date(dataFim)
    );
  }

  /**
   * GET /comissoes/dashboard?dataInicio=2026-02-01&dataFim=2026-02-27
   * 
   * CORREÇÃO: Antes ignorava os query params e sempre usava os últimos 30 dias.
   * Agora passa dataInicio e dataFim para o service corretamente.
   */
  @Get('dashboard')
  async dashboard(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const inicio = dataInicio ? new Date(dataInicio) : undefined;
    const fim = dataFim ? new Date(dataFim) : undefined;

    console.log(`📊 Dashboard solicitado: ${dataInicio ?? 'últimos 30 dias'} a ${dataFim ?? 'hoje'}`);

    return this.comissoesService.getDashboardData(inicio, fim);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comissoesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  update(@Param('id') id: string, @Body() updateComissaoDto: UpdateComissaoDto) {
    return this.comissoesService.update(id, updateComissaoDto);
  }

  @Post('liberar')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.FINANCEIRO)
  @HttpCode(HttpStatus.OK)
  async liberar(@Body() liberarDto: LiberarComissaoDto) {
    const comissoes = await this.comissoesService.liberarComissoesPorRecebimento(liberarDto.contaReceberId);
    return { message: 'Comissões liberadas com sucesso', data: comissoes };
  }

  @Post('pagar')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.FINANCEIRO)
  @HttpCode(HttpStatus.OK)
  async pagar(@Body() pagarDto: PagarComissaoDto, @Request() req) {
    const comissoes = await this.comissoesService.pagarComissoes(pagarDto, req.user.userId);
    return { message: 'Comissões pagas com sucesso', data: comissoes };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.comissoesService.remove(id);
  }

  @Post('recibo-pdf')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.FINANCEIRO)
  @HttpCode(HttpStatus.OK)
  async gerarReciboPDF(@Body() dados: GerarReciboDto) {
    try {
      const pdfBuffer = await this.reciboPdfService.gerarReciboPagamento(dados);
      return {
        message: 'Recibo gerado com sucesso',
        data: pdfBuffer.toString('base64')
      };
    } catch (error) {
      throw new HttpException(
        'Erro ao gerar recibo: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}