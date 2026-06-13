import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateCaixaDto {
  @IsString()
  @MaxLength(50)
  id: string; // No seu caso, deve ser 'PRINCIPAL'

  @IsNumber()
  @IsOptional()
  @Min(0)
  saldoAtual?: number;
}