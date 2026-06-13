import { IsNumber, IsOptional, IsString, Min, IsNotEmpty } from 'class-validator';

export class FaturarVendaDto {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  numeroNf: number;

  @IsString()
  @IsNotEmpty()
  serieNf: string;

  @IsString()
  @IsNotEmpty()
  chaveAcessoNfe: string;

  @IsString()
  @IsOptional()
  xml?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
}