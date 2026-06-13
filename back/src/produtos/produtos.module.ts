import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProdutosService } from './produtos.service';
import { ProdutosController } from './produtos.controller';
import { Produto } from './entities/produto.entity';
import { PdfService } from './pdf.service';
import { ProdutosPdfController } from './produtos-pdf.controller';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Produto]),
forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
],
  controllers: [ProdutosController, ProdutosPdfController],
  providers: [ProdutosService, PdfService],
  exports: [ProdutosService]
})
export class ProdutosModule {}