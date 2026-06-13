import { PartialType } from '@nestjs/mapped-types';
import { CreateVendaItemDto } from './create-venda_iten.dto';

export class UpdateVendaItemDto extends PartialType(CreateVendaItemDto) {}