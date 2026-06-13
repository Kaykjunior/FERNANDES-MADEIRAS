import { Expose, Transform } from 'class-transformer';

export class ResponseVendaItemDto {
  @Expose()
  id: string;

  @Expose()
  vendaId: string;

  @Expose()
  produtoId: string;

  @Expose()
  loteId: string;

  @Expose()
  quantidade: number;

  @Expose()
  valorUnitario: number;

  @Expose()
  valorDesconto: number;

  @Expose()
  valorFreteItem: number;

  @Expose()
  valorSubtotal: number;

  @Expose()
  cfop: string;

  @Expose()
  cstIcms: string;

  @Expose()
  cstPis: string;

  @Expose()
  cstCofins: string;

  @Expose()
  baseIcms: number;

  @Expose()
  valorIcms: number;

  @Expose()
  aliqIcms: number;

  @Expose()
  basePis: number;

  @Expose()
  valorPis: number;

  @Expose()
  baseCofins: number;

  @Expose()
  valorCofins: number;

  @Expose()
  valorIpi: number;
}