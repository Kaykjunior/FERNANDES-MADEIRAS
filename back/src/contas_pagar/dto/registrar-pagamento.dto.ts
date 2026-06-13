import {
  IsNumber, IsPositive, IsEnum,
  IsDateString, IsOptional, IsString,
  IsUUID, Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FormaPagamento } from '../enums/conta-pagar.enum';

export class RegistrarPagamentoDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  valor: number;

  @IsDateString()
  data_pagamento: string;

  @IsEnum(FormaPagamento)
  forma_pagamento: FormaPagamento;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  valor_desconto?: number = 0;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  valor_juros?: number = 0;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  conta_bancaria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comprovante_url?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsUUID()
  usuario_id?: string;
}