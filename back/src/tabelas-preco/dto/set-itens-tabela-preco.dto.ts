import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TabelaPrecoItemInputDto } from './tabela preco item input.dto';

export class SetItensTabelaPrecoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TabelaPrecoItemInputDto)
  itens?: TabelaPrecoItemInputDto[];
}