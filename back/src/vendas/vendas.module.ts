import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendasService } from './vendas.service';
import { VendasController } from './vendas.controller';
import { Venda } from './entities/venda.entity';
import { VendaItem } from '../venda_itens/entities/venda_iten.entity';
import { ContaReceber } from '../contas_receber/entities/contas_receber.entity';
import { Comissao } from '../comissoes/entities/comissoe.entity';
import { Caixa } from '../caixa/entities/caixa.entity';
import { FormasPagamento } from '../formas_pagamento/entities/formas_pagamento.entity';
import { MovimentacaoEstoque } from '../movimentacoes_estoque/entities/movimentacoes_estoque.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { Romaneio } from '../romaneios/entities/romaneio.entity';
import { ConfiguracaoFiscalCFOP } from 'src/configuracoes_fiscais_cfop/entities/configuracoes_fiscais_cfop.entity';
import { Entidade } from '../entidades/entities/entidade.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { EstoqueModule } from '../estoque/estoque.module'; 
import { VendasPdfController } from './vendasPdf.controller';
import { PdfService } from './pdf.service';
import { EnderecosModule } from 'src/enderecos/enderecos.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ComissoesModule } from 'src/comissoes/comissoes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venda,
      VendaItem,
      ContaReceber,
      Comissao,
      Caixa,
      FormasPagamento,
      MovimentacaoEstoque,
      Produto,
      Lote,
      Romaneio,
      ConfiguracaoFiscalCFOP,
      Entidade,
      Usuario,
    ]),
    EstoqueModule, 
    EnderecosModule,
    ComissoesModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [VendasController, VendasPdfController],
  providers: [VendasService, PdfService],
  exports: [VendasService, TypeOrmModule],
})
export class VendasModule { }