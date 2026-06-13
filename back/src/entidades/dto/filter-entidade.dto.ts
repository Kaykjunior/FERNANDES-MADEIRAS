import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoEntidade, TipoPessoa } from '../entities/entidade.entity';

export class FilterEntidadeDto {
  @IsOptional()
  @IsEnum(TipoEntidade)
  tipo_entidade?: TipoEntidade;

  @IsOptional()
  @IsEnum(TipoPessoa)
  tipo_pessoa?: TipoPessoa;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  somente_ativos?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? 1 : Math.max(1, parsed);
  })
  page?: number;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? 10 : Math.max(1, Math.min(100, parsed));
  })
  limit?: number;
}