import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaixaService } from './caixa.service';
import { CaixaController } from './caixa.controller';
import { Caixa } from './entities/caixa.entity';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Caixa]),
  forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
  ],

  controllers: [CaixaController],
  providers: [CaixaService],
  exports: [CaixaService],
})
export class CaixaModule { }