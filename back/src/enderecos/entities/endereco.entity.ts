import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Entidade } from '../../entidades/entities/entidade.entity';

export enum TipoEndereco {
  PRINCIPAL = 'PRINCIPAL',
  COBRANCA = 'COBRANCA',
  ENTREGA = 'ENTREGA',
  COMERCIAL = 'COMERCIAL',
  RESIDENCIAL = 'RESIDENCIAL',
  OUTROS = 'OUTROS'
}

@Entity('enderecos')
@Index('idx_endereco_entidade', ['entidadeId'])
export class Endereco {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'uuid', 
    name: 'entidade_id' 
  })
  entidadeId: string;

  @ManyToOne(() => Entidade, (entidade) => entidade.enderecos, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'entidade_id' })
  entidade: Entidade;

  @Column({
    type: 'enum',
    enum: TipoEndereco,
    default: TipoEndereco.PRINCIPAL,
    name: 'tipo_endereco'
  })
  tipoEndereco: TipoEndereco;

  @Column({ 
    length: 255, 
    name: 'logradouro' 
  })
  logradouro: string;

  @Column({ 
    length: 20, 
    name: 'numero' 
  })
  numero: string;

  @Column({ 
    length: 100, 
    name: 'complemento', 
    nullable: true 
  })
  complemento: string;

  @Column({ 
    length: 100, 
    name: 'bairro' 
  })
  bairro: string;

  @Column({ 
    length: 100, 
    name: 'cidade' 
  })
  cidade: string;

  @Column({ 
    length: 2, 
    name: 'estado' 
  })
  estado: string;

  @Column({ 
    length: 9, 
    name: 'cep' 
  })
  cep: string;

  @Column({ 
    length: 100, 
    name: 'pais', 
    default: 'Brasil' 
  })
  pais: string;

  @Column({ 
    name: 'padrao', 
    default: false 
  })
  padrao: boolean;

  @Column({ 
    type: 'text', 
    nullable: true 
  })
  observacoes: string;

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