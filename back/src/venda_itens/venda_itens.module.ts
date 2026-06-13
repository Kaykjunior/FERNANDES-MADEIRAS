import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendaItensService } from './venda_itens.service';
import { VendaItensController } from './venda_itens.controller';
import { VendaItem } from './entities/venda_iten.entity';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendaItem]), // ESSENCIAL: Registrar a entidade aqui
    forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
  ],
  controllers: [VendaItensController],
  providers: [VendaItensService],
  exports: [VendaItensService, TypeOrmModule], // Exportar se outros módulos precisarem
})
export class VendaItensModule {}