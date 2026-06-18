import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TabelaPrecoItemInputDto } from './tabela preco item input.dto';

export class CreateTabelaPrecoDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da tabela de preços é obrigatório' })
  nome?: string;

  @IsOptional()
  @IsString()
  @IsIn(['TRATADA', 'IN_NATURA', 'ESPECIAL', 'OUTRA'], {
    message: 'Tipo inválido. Use TRATADA, IN_NATURA, ESPECIAL ou OUTRA',
  })
  tipo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  padrao?: boolean;

  // Itens iniciais (produto + preço) podem ser enviados junto na criação
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TabelaPrecoItemInputDto)
  itens?: TabelaPrecoItemInputDto[];
}