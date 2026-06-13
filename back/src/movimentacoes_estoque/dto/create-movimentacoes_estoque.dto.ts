import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TipoMovimentacao } from '../entities/movimentacoes_estoque.entity';

export class CreateMovimentacoesEstoqueDto {
  @IsEnum(TipoMovimentacao)
  @IsNotEmpty()
  tipo: TipoMovimentacao;

  @IsUUID()
  @IsNotEmpty()
  produtoId: string;

  @IsUUID()
  @IsOptional()
  loteId?: string;

  @IsUUID()
  @IsOptional()
  vendaItemId?: string;

  @IsUUID()
  @IsNotEmpty()
  usuarioId: string;

  @IsNumber()
  @IsNotEmpty()
  quantidade: number;

  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
}