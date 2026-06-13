// src/comissoes/comissoes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComissoesService } from './comissoes.service';
import { ComissoesController } from './comissoes.controller';
import { Comissao } from './entities/comissoe.entity';
import { Venda } from '../vendas/entities/venda.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { ContaReceber } from '../contas_receber/entities/contas_receber.entity';
import { VendaItem } from '../venda_itens/entities/venda_iten.entity';
import { ReciboPdfService } from './recibo-pdf.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comissao, Venda, Usuario, ContaReceber, VendaItem])
  ],
  controllers: [ComissoesController],
  providers: [ComissoesService, ReciboPdfService],
  exports: [ComissoesService]
})
export class ComissoesModule {}