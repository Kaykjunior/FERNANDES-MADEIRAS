import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
  Length,
  IsBoolean,
  IsUUID
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoEndereco } from '../entities/endereco.entity';

export class CreateEnderecoDto {
  @IsUUID()
  @IsNotEmpty()
  entidade_id: string;

  @IsEnum(TipoEndereco)
  tipo_endereco: TipoEndereco;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  logradouro: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  numero: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  complemento?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bairro: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cidade: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  estado: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.replace(/\D/g, ''))
  @Length(8, 8)
  cep: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  pais?: string;

  @IsBoolean()
  @IsOptional()
  padrao?: boolean;

  @IsString()
  @IsOptional()
  observacoes?: string;
}