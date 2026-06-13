import { PartialType } from '@nestjs/mapped-types';
import { CreateContasPagarDto } from './create-contas_pagar.dto';

export class UpdateContasPagarDto extends PartialType(CreateContasPagarDto) {}
