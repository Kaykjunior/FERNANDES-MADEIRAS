import {
  IsString, IsOptional, IsEnum, IsNumber, IsDateString,
  IsArray, ValidateNested, IsUUID, Min, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusLicitacao } from '../entities/Licitacao.entity';

// ─────────────────────────────────────────────────────────────────────────────

export class CreateLicitacaoItemDto {
  @IsUUID()
  produtoId: string;

  @IsNumber()
  @Min(0.001)
  quantidade: number;

  @IsNumber()
  @Min(0)
  precoReferencia: number;
}

export class CreateLicitacaoLoteDto {
  @IsNumber()
  numero: number;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  meuLance?: number;

  @IsOptional()
  @IsNumber()
  lanceConcorrente?: number;

  @IsOptional()
  @IsBoolean()
  ganhouLote?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLicitacaoItemDto)
  itens: CreateLicitacaoItemDto[];
}

export class CreateLicitacaoDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  numeroEdital?: string;

  @IsOptional()
  @IsString()
  orgao?: string;

  @IsDateString()
  dataAbertura: string;

  @IsDateString()
  dataEncerramento: string;

  @IsOptional()
  @IsEnum(StatusLicitacao)
  status?: StatusLicitacao;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freteTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custoAdicional?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  margemMinimaPercent?: number;

  @IsOptional()
  @IsBoolean()
  ganhou?: boolean;

  @IsOptional()
  @IsNumber()
  valorContratado?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLicitacaoLoteDto)
  lotes: CreateLicitacaoLoteDto[];
}

// ─────────────────────────────────────────────────────────────────────────────

/** Atualiza apenas os lances de um lote durante o pregão */
export class UpdateLanceDto {
  @IsOptional()
  @IsNumber()
  meuLance?: number;

  @IsOptional()
  @IsNumber()
  lanceConcorrente?: number;

  @IsOptional()
  @IsBoolean()
  ganhouLote?: boolean;
}

/** Finaliza a licitação com resultado */
export class FinalizarLicitacaoDto {
  @IsBoolean()
  ganhou: boolean;

  @IsOptional()
  @IsNumber()
  valorContratado?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;
}