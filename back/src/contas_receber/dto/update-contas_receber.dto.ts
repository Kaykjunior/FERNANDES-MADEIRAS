import { StatusContaReceber } from "../entities/contas_receber.entity";

// src/contas_receber/dto/update-conta.dto.ts
export class UpdateContaDto {
  valorPago?: number;
  acrescimos?: number;
  descontos?: number;
  dataPagamento?: Date;
  status?: StatusContaReceber;
  formaPagamentoId?: number;
}