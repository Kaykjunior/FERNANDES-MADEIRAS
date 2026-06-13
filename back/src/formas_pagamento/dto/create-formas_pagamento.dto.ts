import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min, MaxLength } from 'class-validator';

export class CreateFormasPagamentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nome: string;

  @IsString()
  @IsOptional()
  @MaxLength(2)
  codigoSefaz?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxaAdm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  diasRecebimento?: number;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}