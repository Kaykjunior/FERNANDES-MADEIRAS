import { PartialType } from '@nestjs/mapped-types';
import { CreateConfiguracoesFiscaisCfopDto } from './create-configuracoes_fiscais_cfop.dto';

export class UpdateConfiguracoesFiscaisCfopDto extends PartialType(CreateConfiguracoesFiscaisCfopDto) {}
