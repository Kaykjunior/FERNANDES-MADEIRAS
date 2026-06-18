import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  ParseFloatPipe,
  Query,
} from '@nestjs/common';
import { TabelasPrecoService } from './tabelas-preco.service';
import { CreateTabelaPrecoDto } from './dto/create tabela preco.dto';
import { UpdateTabelaPrecoDto } from './dto/update tabela preco.dto';
import { SetItensTabelaPrecoDto } from './dto/set-itens-tabela-preco.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('tabelas-preco')
@UseGuards(JwtAuthGuard)
export class TabelasPrecoController {
  constructor(private readonly service: TabelasPrecoService) {}

  @Post()
  create(@Body() dto: CreateTabelaPrecoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // Lista os produtos (com preço aplicado) de uma tabela específica.
  // Usado pela tela de Vendas ao iniciar um pedido.
  @Get(':id/produtos')
  getProdutos(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getProdutosPorTabela(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTabelaPrecoDto) {
    return this.service.update(id, dto);
  }

  // Substitui toda a lista de produtos/preços da tabela
  @Patch(':id/itens')
  setItens(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetItensTabelaPrecoDto) {
    return this.service.setItens(id, dto);
  }

  // Adiciona/atualiza o preço de um produto específico nesta tabela
  @Patch(':id/itens/:produtoId')
  upsertItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('produtoId', ParseUUIDPipe) produtoId: string,
    @Body('preco', ParseFloatPipe) preco: number,
    @Body('ativo') ativo?: boolean,
  ) {
    return this.service.upsertItem(id, produtoId, preco, ativo ?? true);
  }

  @Delete(':id/itens/:produtoId')
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('produtoId', ParseUUIDPipe) produtoId: string,
  ) {
    return this.service.removeItem(id, produtoId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}