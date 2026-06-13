import { PartialType } from '@nestjs/mapped-types';
import { CreateFormasPagamentoDto } from './create-formas_pagamento.dto';

export class UpdateFormasPagamentoDto extends PartialType(CreateFormasPagamentoDto) {}
