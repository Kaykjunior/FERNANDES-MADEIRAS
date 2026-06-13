import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContasPagarController } from './contas_pagar.controller';
import { ContasPagarService } from './contas_pagar.service';
import { ContaPagar } from './entities/contas_pagar.entity';
import { ContaPagarParcela } from './entities/conta-pagar-parcela.entity';
import { ContaPagarPagamento } from './entities/conta-pagar-pagamento.entity';
import { CategoriaDespesa } from './entities/categoria-despesa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContaPagar,
      ContaPagarParcela,
      ContaPagarPagamento,
      CategoriaDespesa,
    ]),
  ],
  controllers: [ContasPagarController],
  providers: [ContasPagarService],
  exports: [ContasPagarService],
})
export class ContasPagarModule {}