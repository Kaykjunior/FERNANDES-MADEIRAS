import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importe TODOS os módulos
import { UsuarioModule } from './usuario/usuario.module';
import { AuditoriaLogsModule } from './auditoria_logs/auditoria_logs.module';
import { EntidadesModule } from './entidades/entidades.module';
import { EnderecosModule } from './enderecos/enderecos.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ProdutosModule } from './produtos/produtos.module';
import { RomaneiosModule } from './romaneios/romaneios.module';
import { LotesModule } from './lotes/lotes.module';
import { MovimentacoesEstoqueModule } from './movimentacoes_estoque/movimentacoes_estoque.module';
import { ConfiguracoesFiscaisCfopModule } from './configuracoes_fiscais_cfop/configuracoes_fiscais_cfop.module';
import { FormasPagamentoModule } from './formas_pagamento/formas_pagamento.module';
import { VendasModule } from './vendas/vendas.module';
import { VendaItensModule } from './venda_itens/venda_itens.module';
import { CaixaModule } from './caixa/caixa.module';
import { ContasPagarModule } from './contas_pagar/contas_pagar.module';
import { ContasReceberModule } from './contas_receber/contas_receber.module';
import { ComissoesModule } from './comissoes/comissoes.module';
import { EstoqueModule } from './estoque/estoque.module';
import { LicitacoesModule } from './licitacao/Licitacoes.module';

@Module({
  imports: [
    // 1. Configuração de variáveis de ambiente PRIMEIRO
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Configuração do TypeORM (deve vir ANTES dos outros módulos)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true, // Carrega entidades automaticamente
      synchronize: true,      // CUIDADO: Em produção use false e utilize migrations
      logging: false,          
      extra: {
        timezone: 'America/Sao_Paulo',
      }
    }),

    // 3. Importe TODOS os módulos da aplicação
    UsuarioModule,
    AuditoriaLogsModule,
    EntidadesModule,
    EnderecosModule,
    CategoriasModule,
    ProdutosModule,
    RomaneiosModule,
    LotesModule,
    MovimentacoesEstoqueModule,
    ConfiguracoesFiscaisCfopModule,
    FormasPagamentoModule,
    VendasModule,
    VendaItensModule,
    CaixaModule,
    ContasPagarModule,
    ContasReceberModule,
    ComissoesModule,
    EstoqueModule,
    LicitacoesModule  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }