import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimentacoesEstoqueDto } from './create-movimentacoes_estoque.dto';

export class UpdateMovimentacoesEstoqueDto extends PartialType(CreateMovimentacoesEstoqueDto) {}
