import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EstoqueService } from './estoque.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Post('entrada')
  @UseGuards(JwtAuthGuard)
  async entrada(
    @Body() dados: {
      produtoId: string;
      quantidade: number;
      custoUnitario?: number;
      motivo: string;
      usuarioId: string;
      localizacao?: string;
    },
  ) {
    return this.estoqueService.entradaEstoque(dados);
  }

  @Post('ajuste')
  @UseGuards(JwtAuthGuard)
  async ajuste(
    @Body() dados: {
      produtoId: string;
      quantidade: number;
      motivo: string;
      usuarioId: string;
    },
  ) {
    return this.estoqueService.ajustarEstoque(dados);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listar() {
    return this.estoqueService.listarEstoque();
  }

  @Get(':produtoId/disponivel')
  @UseGuards(JwtAuthGuard)
  async disponivel(@Param('produtoId') produtoId: string) {
    const quantidade = await this.estoqueService.consultarDisponivel(produtoId);
    return { produtoId, quantidadeDisponivel: quantidade };
  }

  @Get(':produtoId')
  @UseGuards(JwtAuthGuard)
  async findByProduto(@Param('produtoId') produtoId: string) {
    const estoque = await this.estoqueService.findOneByProduto(produtoId);
    return estoque || { message: 'Estoque não encontrado para este produto' };
  }

  @Post('reservar')
  @UseGuards(JwtAuthGuard)
  async reservar(
    @Body() itens: Array<{ produtoId: string; quantidade: number }>,
  ) {
    await this.estoqueService.reservarParaVenda(itens);
    return { message: 'Estoque reservado com sucesso' };
  }

  @Post('confirmar-saida')
  @UseGuards(JwtAuthGuard)
  async confirmarSaida(
    @Body() itens: Array<{ produtoId: string; quantidade: number }>,
  ) {
    await this.estoqueService.confirmarSaida(itens);
    return { message: 'Saída de estoque confirmada' };
  }

  @Post('cancelar-reserva')
  @UseGuards(JwtAuthGuard)
  async cancelarReserva(
    @Body() itens: Array<{ produtoId: string; quantidade: number }>,
  ) {
    await this.estoqueService.cancelarReserva(itens);
    return { message: 'Reserva de estoque cancelada' };
  }

  @Post('devolver')
  @UseGuards(JwtAuthGuard)
  async devolver(
    @Body() itens: Array<{ produtoId: string; quantidade: number }>,
  ) {
    await this.estoqueService.devolverEstoque(itens);
    return { message: 'Estoque devolvido com sucesso' };
  }
}