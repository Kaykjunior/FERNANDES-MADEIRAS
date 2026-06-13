/**
 * @file contas_receber.module.ts
 *
 * Módulo de Contas a Receber.
 *
 * DEPENDÊNCIAS CIRCULARES:
 *   - VendasModule: ContasReceberService usa VendasService.movimentarCaixaComManager()
 *     e VendasService usa ContasReceberService para gerarFinanceiro().
 *     Resolvido com forwardRef() nos dois lados.
 *   - ComissoesModule: ao liquidar uma conta, o service libera a comissão vinculada.
 */

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContasReceberService } from './contas_receber.service';
import { ContasReceberController } from './contas_receber.controller';
import { ContaReceber } from './entities/contas_receber.entity';
import { VendasModule } from '../vendas/vendas.module';
import { ComissoesModule } from '../comissoes/comissoes.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContaReceber]),

    // forwardRef resolve a dependência circular entre Vendas e ContasReceber
    forwardRef(() => VendasModule),

    // Necessário para liberar comissões ao liquidar contas
    ComissoesModule,

    forwardRef(() => AuthModule),
  ],
  controllers: [ContasReceberController],
  providers: [ContasReceberService],
  exports: [ContasReceberService],
})
export class ContasReceberModule {}
