import { PartialType } from '@nestjs/mapped-types';
import { CreateRomaneioDto } from './create-romaneio.dto';

export class UpdateRomaneioDto extends PartialType(CreateRomaneioDto) {}
