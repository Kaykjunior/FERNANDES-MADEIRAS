import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtosService.create(createProdutoDto);
  }


  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.produtosService.findAll();
  }

  // Lista produtos com as tabelas de preços (e respectivos preços) associadas.
  // Rota específica antes de ':id' para não conflitar.
  @Get('com-tabelas-preco')
  @UseGuards(JwtAuthGuard)
  findAllComTabelasPreco() {
    return this.produtosService.findAllComTabelasPreco();
  }

  @Get('medidas/lista') // <-- rota específica antes do :id
  findMedidas() {
    return this.produtosService.findMedidas();
  }

  @Get('tabela/:categoriaId')
  @UseGuards(JwtAuthGuard)
  gerarTabela(@Param('categoriaId', ParseIntPipe) categoriaId: number) {
    return this.produtosService.getTabelaPrecos(categoriaId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.produtosService.findOne(id);
  }

  // Detalhe do produto incluindo as tabelas de preços às quais pertence
  @Get(':id/tabelas-preco')
  @UseGuards(JwtAuthGuard)
  findOneComTabelasPreco(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtosService.findOneComTabelasPreco(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProdutoDto: UpdateProdutoDto // Use o DTO de atualização
  ) {
    return this.produtosService.update(id, updateProdutoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    // Mantém a deleção individual para uso comum
    return this.produtosService.remove(id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard) // Cuidado: Rota DELETE /produtos apaga TUDO
  async removeAll() {
    // ADICIONEI O "()" E O "await" - Sem isso, o Nest não executa a lógica
    return await this.produtosService.removeAll();
  }


}