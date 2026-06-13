import { PartialType } from '@nestjs/mapped-types';
import { CreateEnderecoDto } from './create-endereco.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateEnderecoDto extends PartialType(CreateEnderecoDto) {
  @IsOptional()
  @IsBoolean()
  padrao?: boolean;
}