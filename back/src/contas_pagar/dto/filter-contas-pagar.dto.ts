import {
  IsOptional, IsEnum, IsDateString,
  IsString, IsNumber, IsUUID, IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { StatusContaPagar, FormaPagamento, TipoDespesa } from '../enums/conta-pagar.enum';

export class FilterContasPagarDto {
  @IsOptional()
  @IsEnum(StatusContaPagar)
  status?: StatusContaPagar;

  @IsOptional()
  @IsUUID()
  categoria_id?: string;

  @IsOptional()
  @IsString()
  beneficiario?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  numero_documento?: string;

  @IsOptional()
  @IsString()
  centro_custo?: string;

  @IsOptional()
  @IsDateString()
  vencimento_de?: string;

  @IsOptional()
  @IsDateString()
  vencimento_ate?: string;

  @IsOptional()
  @IsDateString()
  competencia_de?: string;

  @IsOptional()
  @IsDateString()
  competencia_ate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valor_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valor_max?: number;

  @IsOptional()
  @IsEnum(FormaPagamento)
  forma_pagamento?: FormaPagamento;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  apenas_vencidos?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  apenas_recorrentes?: boolean;

  // Paginação
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  // Ordenação
  @IsOptional()
  @IsString()
  order_by?: 'data_vencimento' | 'valor_total' | 'created_at' | 'status' = 'data_vencimento';

  @IsOptional()
  @IsString()
  order_dir?: 'ASC' | 'DESC' = 'ASC';
}