import { IsNumber, IsOptional, IsBoolean, IsUUID, Min } from 'class-validator';

export class TabelaPrecoItemInputDto {
  @IsUUID()
  produtoId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}