// src/comissoes/dto/create-comissao.dto.ts
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, Max, IsDate, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { StatusComissao, TipoCalculoComissao } from '../entities/comissoe.entity';

export class CreateComissaoDto {
  @IsUUID()
  @IsNotEmpty()
  vendedorId: string;

  @IsUUID()
  @IsNotEmpty()
  vendaId: string;

  @IsOptional()
  @IsUUID()
  contaReceberId?: string;

  @IsOptional()
  @IsEnum(TipoCalculoComissao)
  tipoCalculo?: TipoCalculoComissao;

  @IsNumber()
  @Min(0)
  baseCalculo: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentualAplicado: number;

  @IsNumber()
  @Min(0)
  valorComissao: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custoOperacional?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  margemLiquida?: number;

  @IsOptional()
  @IsEnum(StatusComissao)
  status?: StatusComissao;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class LiberarComissaoDto {
  @IsUUID()
  @IsNotEmpty()
  contaReceberId: string;
}

export class PagarComissaoDto {
  @IsArray()
  @IsUUID('all', { each: true })
  comissoesIds: string[];

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class FiltrarComissoesDto {
  @IsOptional()
  @IsUUID()
  vendedorId?: string;

  @IsOptional()
  @IsEnum(StatusComissao)
  status?: StatusComissao;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;

  @IsOptional()
  @IsUUID()
  vendaId?: string;
}
