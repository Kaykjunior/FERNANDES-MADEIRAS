import { IsNumber, IsOptional, IsUUID, IsDateString, Min } from 'class-validator';

export class CreateContaReceberDto {
  @IsUUID()
  clienteId: string;

  @IsOptional()
  @IsUUID()
  vendaId?: string;

  @IsNumber()
  @Min(0)
  valorParcela: number;

  @IsDateString()
  dataVencimento: Date;

  @IsNumber()
  @IsOptional()
  formaPagamentoId?: number;
}
