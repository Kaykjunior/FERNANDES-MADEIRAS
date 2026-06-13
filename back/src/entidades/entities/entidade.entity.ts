import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany
} from 'typeorm';
import { Endereco } from 'src/enderecos/entities/endereco.entity';

export enum TipoEntidade {
  CLIENTE = 'CLIENTE',
  FORNECEDOR = 'FORNECEDOR',
  TRANSPORTADORA = 'TRANSPORTADORA',
  AMBOS = 'AMBOS'
}

export enum TipoPessoa {
  FISICA = 'F',
  JURIDICA = 'J'
}

export enum IndicadorIE {
  CONTRIBUINTE = 1,
  ISENTO = 2,
  NAO_CONTRIBUINTE = 9
}

export enum RegimeTributario {
  SIMPLES = 1,
  LUCRO_REAL = 3
}

@Entity('entidades')
@Index('idx_doc', ['documento']) // Nome correto do campo na entidade
@Index('idx_nome', ['nomeRazaoSocial']) // Nome correto do campo na entidade
export class Entidade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TipoEntidade,
    default: TipoEntidade.CLIENTE,
    name: 'tipo_entidade'
  })
  tipoEntidade: TipoEntidade;

  @Column({
    type: 'enum',
    enum: TipoPessoa,
    name: 'tipo_pessoa'
  })
  tipoPessoa: TipoPessoa;

  @OneToMany(() => Endereco, (endereco) => endereco.entidade, {
    cascade: true
  })
  enderecos: Endereco[];


  @Column({
    length: 20,
    unique: true
  })
  documento: string;

  @Column({
    length: 20,
    name: 'rg_ie',
    nullable: true
  })
  rgIe: string;

  @Column({
    type: 'int',
    name: 'indicador_ie',
    default: IndicadorIE.NAO_CONTRIBUINTE
  })
  indicadorIe: IndicadorIE;

  @Column({
    length: 255,
    name: 'nome_razao_social'
  })
  nomeRazaoSocial: string;

  @Column({
    length: 255,
    name: 'nome_fantasia',
    nullable: true
  })
  nomeFantasia: string;

  @Column({
    length: 100,
    nullable: true
  })
  email: string;

  @Column({
    length: 20,
    nullable: true
  })
  telefone: string;

  @Column({
    length: 20,
    nullable: true
  })
  celular: string;

  @Column({
    type: 'text',
    nullable: true
  })
  observacoes: string;

  @Column({
    type: 'int',
    name: 'regime_tributario',
    nullable: true
  })
  regimeTributario: RegimeTributario;

  @CreateDateColumn({
    name: 'created_at'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at'
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    nullable: true
  })
  deletedAt: Date;
}
