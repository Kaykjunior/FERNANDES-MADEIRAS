import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormasPagamentoService } from './formas_pagamento.service';
import { FormasPagamentoController } from './formas_pagamento.controller';
import { FormasPagamento } from './entities/formas_pagamento.entity';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([FormasPagamento]),
forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
],

  controllers: [FormasPagamentoController],
  providers: [FormasPagamentoService],
  exports: [FormasPagamentoService] // Importante exportar para o VendasModule usar
})
export class FormasPagamentoModule {}