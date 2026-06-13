import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimentacoesEstoqueService } from './movimentacoes_estoque.service';
import { MovimentacoesEstoqueController } from './movimentacoes_estoque.controller';
import { MovimentacaoEstoque } from './entities/movimentacoes_estoque.entity';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MovimentacaoEstoque]), // Certifique-se que está assim
    forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
  ],
  controllers: [MovimentacoesEstoqueController],
  providers: [MovimentacoesEstoqueService],
  exports: [MovimentacoesEstoqueService],
})
export class MovimentacoesEstoqueModule {}