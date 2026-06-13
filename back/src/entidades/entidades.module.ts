import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntidadesService } from './entidades.service';
import { EntidadesController } from './entidades.controller';
import { Entidade } from './entities/entidade.entity';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Entidade]),
forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
],
  controllers: [EntidadesController],
  providers: [EntidadesService],
  exports: [EntidadesService]
})
export class EntidadesModule {}