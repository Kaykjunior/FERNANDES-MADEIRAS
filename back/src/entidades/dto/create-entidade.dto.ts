import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
  ValidateIf,
  IsIn
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoEntidade, TipoPessoa } from '../entities/entidade.entity';
import { IsCpfOrCnpj } from '../validators/cpf-or-cnpj.validator'; // ← Caminho correto

export class CreateEntidadeDto {
  @IsEnum(TipoEntidade)
  tipo_entidade: TipoEntidade;

  @IsEnum(TipoPessoa)
  tipo_pessoa: TipoPessoa;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }) => value.replace(/\D/g, ''))
  @IsCpfOrCnpj({ message: 'Documento inválido para o tipo de pessoa especificado' })
  documento: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Transform(({ value }) => value ? value.replace(/\D/g, '') : value)
  rg_ie?: string;

  @IsIn([1, 2, 9])
  @IsOptional()
  indicador_ie?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome_razao_social: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  nome_fantasia?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Transform(({ value }) => value ? value.replace(/\D/g, '') : value)
  telefone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Transform(({ value }) => value ? value.replace(/\D/g, '') : value)
  celular?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @ValidateIf(o => o.tipo_pessoa === 'J')
  @IsIn([1, 3])
  @IsOptional()
  regime_tributario?: number;
}