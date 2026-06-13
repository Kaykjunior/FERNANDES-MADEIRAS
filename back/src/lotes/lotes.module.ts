import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lote } from './entities/lote.entity';
import { LotesService } from './lotes.service';
import { LotesController } from './lotes.controller';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lote]), // Registra a entidade Lote
    forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
  ],
  controllers: [LotesController],
  providers: [LotesService],
  exports: [TypeOrmModule], // Exporta para outros módulos usarem
})
export class LotesModule {}