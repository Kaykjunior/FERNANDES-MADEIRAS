import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuarioService } from '../../usuario/usuario.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, senhaPassada: string) {
    // Busca o usuário incluindo o campo oculto da senha
    const user = await this.usuarioService.findByEmailWithPassword(email);

    if (!user || !user.ativo) {
      throw new UnauthorizedException('Credenciais inválidas ou usuário inativo');
    }

    // Compara o hash
    const isMatch = await bcrypt.compare(senhaPassada, user.senhaHash);

    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Cria o Payload (o que vai dentro do token)
    const payload = { 
      username: user.email, 
      sub: user.id, 
      cargo: user.cargo 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        cargo: user.cargo,
      }
    };
  }
}