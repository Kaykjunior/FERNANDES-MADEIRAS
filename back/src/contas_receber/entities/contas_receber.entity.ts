import {
  Entity,
  Column,
  PrimaryGeneratedColumn, // Mude para PrimaryGeneratedColumn
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Entidade } from '../../entidades/entities/entidade.entity';
import { Venda } from '../../vendas/entities/venda.entity';
import { FormasPagamento } from '../../formas_pagamento/entities/formas_pagamento.entity';

export enum StatusContaReceber {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  ATRASADO = 'ATRASADO',
  CANCELADO = 'CANCELADO'
}

@Entity({ name: 'contas_receber' })
export class ContaReceber {
  // PARA POSTGRESQL
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    name: 'venda_id',
    nullable: true,
  })
  vendaId: string;

  // CORREÇÃO: Use 'uuid' SEM 'length'
  @Column({
    type: 'uuid',
    name: 'cliente_id',
    nullable: false,
  })
  clienteId: string;

  @ManyToOne(() => Venda, { nullable: true })
  @JoinColumn({ name: 'venda_id' })
  venda: Venda;

  @ManyToOne(() => Entidade)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Entidade;

  @Column({
    type: 'int',
    default: 1,
    name: 'numero_parcela',
  })
  numeroParcela: number;

  @Column({
    type: 'int',
    default: 1,
    name: 'total_parcelas',
  })
  totalParcelas: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.00,
    name: 'valor_aberto',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorAberto: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    name: 'valor_parcela',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorParcela: number;

  @Column({
    type: 'date',
    nullable: false,
    name: 'data_vencimento',
  })
  dataVencimento: Date;

  @Column({
    type: 'date',
    nullable: true,
    name: 'data_pagamento',
  })
  dataPagamento: Date;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'valor_pago',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value ? parseFloat(value) : null,
    },
  })
  valorPago: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value ? parseFloat(value) : null,
    },
  })
  acrescimos: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value ? parseFloat(value) : null,
    },
  })
  descontos: number;

  @Column({
    type: 'enum',
    enum: StatusContaReceber,
    default: StatusContaReceber.PENDENTE,
  })
  status: StatusContaReceber;

  @Column({
    type: 'int',
    nullable: true,
    name: 'forma_pagamento_id'
  })
  formaPagamentoId: number;

  @ManyToOne(() => FormasPagamento, { nullable: true })
  @JoinColumn({ name: 'forma_pagamento_id' })
  formaPagamento: FormasPagamento;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
