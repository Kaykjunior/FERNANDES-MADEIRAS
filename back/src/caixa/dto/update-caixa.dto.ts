import { PartialType } from '@nestjs/mapped-types';
import { CreateCaixaDto } from './create-caixa.dto';

export class UpdateCaixaDto extends PartialType(CreateCaixaDto) {}
