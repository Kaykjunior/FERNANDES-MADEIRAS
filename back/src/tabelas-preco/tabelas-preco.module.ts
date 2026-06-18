import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TabelasPrecoService } from './tabelas-preco.service';
import { TabelasPrecoController } from './tabelas-preco.controller';
import { TabelaPreco } from './entities/tabela preco.entity';
import { TabelaPrecoItem } from './entities/tabela preco item.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TabelaPreco, TabelaPrecoItem, Produto]),
    forwardRef(() => AuthModule),
  ],
  controllers: [TabelasPrecoController],
  providers: [TabelasPrecoService],
  exports: [TabelasPrecoService],
})
export class TabelasPrecoModule {}