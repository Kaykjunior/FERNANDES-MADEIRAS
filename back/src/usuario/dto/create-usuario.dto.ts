import { IsEmail, IsEnum, IsNotEmpty, MinLength, IsOptional, IsNumber } from 'class-validator';
import { UserRole } from '../entities/usuario.entity';

export class CreateUsuarioDto {
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @IsEnum(UserRole)
  cargo: UserRole;

  @IsOptional()
  @IsNumber()
  comissaoPercentual?: number;
}