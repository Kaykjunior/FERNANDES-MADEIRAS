import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, IsArray, Min, IsDate, IsNotEmpty } from 'class-validator';
import { StatusVenda, StatusPagamento } from '../entities/venda.entity';
import { CreateVendaItemDto } from 'src/venda_itens/dto/create-venda_iten.dto';

export class CreateVendaDto {
  @IsUUID()
  clienteId: string;

  @IsOptional()
  @IsUUID()
  vendedorId?: string;

  @IsOptional()
  @IsUUID()
  romaneioId?: string;

  @IsOptional()
  @IsEnum(StatusVenda)
  statusVenda?: StatusVenda;

  @IsOptional()
  @IsEnum(StatusPagamento)
  status?: StatusPagamento;

  @IsNumber()
  @IsNotEmpty()
  formaPagamentoId: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorProdutos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorFrete?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorSeguro?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorDesconto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorOutrasDespesas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorTotal?: number;

  @IsOptional()
  @IsString()
  modeloNf?: string;

  @IsOptional()
  @IsString()
  serieNf?: string;

  @IsOptional()
  @IsNumber()
  numeroNf?: number;

  @IsOptional()
  @IsString()
  chaveAcessoNfe?: string;

  @IsOptional()
  @IsDate()
  dataEmissaoNfe?: Date;

  @IsOptional()
  @IsString()
  xmlAutorizado?: string;

  @IsOptional()
  @IsString()
  observacoesFisco?: string;

  @IsOptional()
  @IsString()
  observacoesCliente?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaItemDto)
  itens: CreateVendaItemDto[];
} 