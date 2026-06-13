import { PartialType } from '@nestjs/mapped-types';
import { CreateEntidadeDto } from './create-entidade.dto';
import { IsOptional, ValidateIf } from 'class-validator';
import { IsCpfOrCnpj } from '../validators/cpf-or-cnpj.validator';

export class UpdateEntidadeDto extends PartialType(CreateEntidadeDto) {
  @IsOptional()
  @ValidateIf(o => o.documento !== undefined)
  @IsCpfOrCnpj({ message: 'Documento inválido para o tipo de pessoa especificado' })
  documento?: string;
}