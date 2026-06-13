// src/comissoes/dto/update-comissao.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateComissaoDto } from './create-comissoe.dto';

export class UpdateComissaoDto extends PartialType(CreateComissaoDto) {}