import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateVendaItemDto {
  @IsOptional() 
  @IsUUID()
  vendaId: string;

  @IsUUID()
  produtoId: string;

  @IsOptional()
  @IsUUID()
  loteId?: string;

  @IsNumber()
  @Min(0.001)
  quantidade: number;

  @IsNumber()
  @Min(0)
  valorUnitario: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorDesconto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorFreteItem?: number;

  @IsNumber()
  @Min(0)
  valorSubtotal: number;

  @IsString()
  cfop: string;

  @IsOptional()
  @IsString()
  cstIcms?: string;

  @IsOptional()
  @IsString()
  cstPis?: string;

  @IsOptional()
  @IsString()
  cstCofins?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseIcms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorIcms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  aliqIcms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePis?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorPis?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseCofins?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorCofins?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorIpi?: number;
}