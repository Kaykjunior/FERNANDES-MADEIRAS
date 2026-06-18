import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdateTabelaPrecoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  @IsIn(['TRATADA', 'IN_NATURA', 'ESPECIAL', 'OUTRA'], {
    message: 'Tipo inválido. Use TRATADA, IN_NATURA, ESPECIAL ou OUTRA',
  })
  tipo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  padrao?: boolean;
}