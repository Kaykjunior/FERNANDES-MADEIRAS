import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum AplicacaoCFOP {
  DENTRO_ESTADO = 'DENTRO_ESTADO',
  FORA_ESTADO = 'FORA_ESTADO',
  EXPORTACAO = 'EXPORTACAO'
}

@Entity({ name: 'configuracoes_fiscais_cfop' })
export class ConfiguracaoFiscalCFOP {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'varchar',
    length: 4,
    nullable: false,
  })
  cfop: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  descricao: string;

  @Column({
    type: 'enum',
    enum: AplicacaoCFOP,
    nullable: true,
  })
  aplicacao: AplicacaoCFOP;
}
