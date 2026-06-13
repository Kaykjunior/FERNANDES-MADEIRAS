import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Licitacao }     from './entities/Licitacao.entity';
import { LicitacaoLote } from './entities/Licitacao lote.entity';
import { LicitacaoItem } from './entities/Licitacao item.entity';
import { Produto }       from 'src/produtos/entities/produto.entity';

import { LicitacoesService }    from './Licitacoes.service';
import { LicitacoesController } from './Licitacoes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Licitacao,
      LicitacaoLote,
      LicitacaoItem,
      Produto,
    ]),
  ],
  controllers: [LicitacoesController],
  providers:   [LicitacoesService],
  exports:     [LicitacoesService],
})
export class LicitacoesModule {}