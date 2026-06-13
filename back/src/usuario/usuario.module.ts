import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { Usuario } from './entities/usuario.entity';
import { AuthModule } from '../modules/auth/auth.module'; // Ajuste o caminho

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService], 
})
export class UsuarioModule {}