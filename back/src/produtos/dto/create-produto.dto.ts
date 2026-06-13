import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsNotEmpty, IsInt } from 'class-validator';

export class CreateProdutoDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
  nome: string;

  @IsOptional()
  @IsString()
  codigo_sku?: string;

  // Change: Added validation decorator so the pipe accepts it
  @IsInt()
  @IsOptional()
  categoria_id: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  comprimento_mt: number;

  @IsInt()
  @Min(0)
  diametro_min: number;

  @IsInt()
  @Min(0)
  diametro_max: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  peso_unitario_kg: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_venda_base: number;

  @IsString()
  @IsOptional()
  unidade_comercial?: string;

  // Change: Added missing field that caused the error
  @IsString()
  @IsOptional()
  dimensao_ripa?: string;

  @IsString()
  @IsNotEmpty({ message: 'O NCM é obrigatório para fins fiscais' })
  ncm: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}