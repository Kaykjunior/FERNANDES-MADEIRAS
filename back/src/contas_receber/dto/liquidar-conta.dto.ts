import { IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class LiquidarContaDto {
  @IsNumber()
  @Min(0.01)
  valorPago: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  acrescimos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descontos?: number;

  @IsOptional()
  @IsDateString()
  dataPagamento?: Date;

  @IsOptional() // 👈 ADICIONE ESTA LINHA
  @IsNumber()   // 👈 ADICIONE ESTA LINHA
  formaPagamentoId?: number; // 👈 ADICIONE ESTA LINHA
}