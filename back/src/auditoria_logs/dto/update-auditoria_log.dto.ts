import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditoriaLogDto } from './create-auditoria_log.dto';

export class UpdateAuditoriaLogDto extends PartialType(CreateAuditoriaLogDto) {}
