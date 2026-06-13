// dto/update-produto.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateProdutoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  codigo_sku?: string;

  @IsOptional()
  @IsNumber()
  categoria_id?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  comprimento_mt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  diametro_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  diametro_max?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  peso_unitario_kg?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_venda_base?: number;

  @IsOptional()
  @IsString()
  unidade_comercial?: string;

  @IsOptional()
  @IsString()
  dimensao_ripa?: string;

  @IsOptional()
  @IsString()
  ncm?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}