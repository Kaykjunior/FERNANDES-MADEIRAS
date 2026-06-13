import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasService } from './categorias.service';
import { CategoriasController } from './categorias.controller';
import { Categoria } from './entities/categoria.entity';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria]),
  forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
  ],
  controllers: [CategoriasController],
  providers: [CategoriasService],
  exports: [CategoriasService], // Exportamos para que o ProdutosModule possa usar se precisar
})
export class CategoriasModule { }