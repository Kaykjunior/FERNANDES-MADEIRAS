// backend/src/comissoes/dto/gerar-recibo.dto.ts
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// ORDEM CORRETA: Primeiro as classes mais internas, depois as que as usam
// ============================================================================

// 1. ClienteDto (mais interno)
class ClienteDto {
  @IsString()
  nomeRazaoSocial: string;
}

// 2. VendaDto (usa ClienteDto)
class VendaDto {
  @IsOptional()
  @IsNumber()
  numeroPedido?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClienteDto)
  cliente?: ClienteDto;

  @IsString()
  createdAt: string;
}

// 3. ComissaoDto (usa VendaDto)
class ComissaoDto {
  @IsString()
  id: string;

  @IsString()
  vendaId: string;

  @IsNumber()
  baseCalculo: number;

  @IsNumber()
  percentualAplicado: number;

  @IsNumber()
  valorComissao: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => VendaDto)
  venda?: VendaDto;
}

// 4. VendedorDto
class VendedorDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  email: string;

  @IsString()
  cargo: string;

  @IsNumber()
  comissaoPercentual: number;

  @IsOptional()
  @IsString()
  filial?: string;

  @IsOptional()
  @IsString()
  cpf?: string;
}

// 5. PeriodoDto
class PeriodoDto {
  @IsString()
  inicio: string;

  @IsString()
  fim: string;
}

// 6. PagadorDto
class PagadorDto {
  @IsString()
  nome: string;

  @IsString()
  cargo: string;
}

// 7. GerarReciboDto (usa todas as classes acima)
export class GerarReciboDto {
  @IsString()
  @IsNotEmpty()
  numeroRecibo: string;

  @IsString()
  @IsNotEmpty()
  dataPagamento: string;

  @ValidateNested()
  @Type(() => VendedorDto)
  vendedor: VendedorDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComissaoDto)
  comissoes: ComissaoDto[];

  @IsNumber()
  valorTotal: number;

  @IsString()
  valorExtenso: string;

  @ValidateNested()
  @Type(() => PeriodoDto)
  periodo: PeriodoDto;

  @ValidateNested()
  @Type(() => PagadorDto)
  pagador: PagadorDto;

  @IsOptional()
  @IsString()
  observacoes?: string;
}