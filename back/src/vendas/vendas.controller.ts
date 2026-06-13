import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UsePipes,
  ValidationPipe,
  UseGuards
} from '@nestjs/common';
import { VendasService } from './vendas.service';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';
import { StatusVenda } from './entities/venda.entity';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('vendas')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class VendasController {
  constructor(private readonly vendasService: VendasService) { }

  @Post()
  create(@Body() createVendaDto: CreateVendaDto) {
    return this.vendasService.create(createVendaDto);
  }

  @Get()
  findAll() {
    return this.vendasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendasService.findOne(id);
  }

  /**
   * Atualização parcial (campos simples, sem substituição de itens).
   * Só funciona em ORÇAMENTO.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVendaDto: UpdateVendaDto) {
    return this.vendasService.update(id, updateVendaDto);
  }

  /**
   * Atualização completa: substitui itens, recalcula valores e re-reserva estoque.
   * Usado pelo frontend de edição de pedido.
   * Só funciona em ORÇAMENTO (pode aprovar na mesma chamada via statusVenda: 'APROVADO').
   */
  @Put(':id')
  updateFull(@Param('id') id: string, @Body() createVendaDto: CreateVendaDto) {
    return this.vendasService.updateFull(id, createVendaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vendasService.remove(id);
  }

  @Put(':id/aprovar')
  aprovarVenda(@Param('id') id: string) {
    return this.vendasService.atualizarStatus(id, StatusVenda.APROVADO);
  }

  @Put(':id/cancelar')
  cancelarVenda(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
  ) {
    return this.vendasService.atualizarStatus(id, StatusVenda.CANCELADO, motivo);
  }

  @Put(':id/faturar')
  faturarVenda(
    @Param('id') id: string,
    @Body() dadosFaturamento: any,
  ) {
    return this.vendasService.faturarVenda(id, dadosFaturamento);
  }
}