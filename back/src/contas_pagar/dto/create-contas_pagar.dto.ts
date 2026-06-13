import {
  IsString, IsNumber, IsOptional, IsBoolean, IsEnum,
  IsDateString, IsPositive, IsInt, Min, Max,
  MaxLength, IsUUID, ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FormaPagamento, TipoDespesa, TipoRecorrencia,
} from '../enums/conta-pagar.enum';

export class CreateContasPagarDto {
  @IsString()
  @MaxLength(255)
  descricao: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numero_documento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiario?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  valor_total: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  valor_desconto?: number;

  @IsDateString()
  data_vencimento: string;

  @IsOptional()
  @IsDateString()
  data_competencia?: string;

  @IsOptional()
  @IsEnum(FormaPagamento)
  forma_pagamento?: FormaPagamento;

  @IsOptional()
  @IsUUID()
  categoria_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  centro_custo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  conta_bancaria?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(360)
  numero_parcelas?: number = 1;

  @IsOptional()
  @IsBoolean()
  recorrente?: boolean = false;

  @ValidateIf((o) => o.recorrente === true)
  @IsEnum(TipoRecorrencia)
  tipo_recorrencia?: TipoRecorrencia;

  @ValidateIf((o) => o.recorrente === true)
  @IsDateString()
  recorrencia_fim?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  anexo_url?: string;

  @IsOptional()
  @IsUUID()
  usuario_id?: string;
}