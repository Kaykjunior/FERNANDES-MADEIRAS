// src/comissoes/entities/comissoe.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Venda } from '../../vendas/entities/venda.entity';
import { ContaReceber } from '../../contas_receber/entities/contas_receber.entity';

export enum StatusComissao {
  PREVISTA = 'PREVISTA',     // Comissão calculada mas venda não paga
  LIBERADA = 'LIBERADA',      // Venda paga, comissão disponível
  PAGA = 'PAGA',              // Comissão já paga ao vendedor
  CANCELADA = 'CANCELADA'     // Venda cancelada
}

export enum TipoCalculoComissao {
  PERCENTUAL_VENDA = 'PERCENTUAL_VENDA',
  PERCENTUAL_LUCRO = 'PERCENTUAL_LUCRO',
  VALOR_FIXO = 'VALOR_FIXO',
  TABELADA = 'TABELADA'
}

@Entity({ name: 'comissoes' })
@Index(['vendedorId', 'status', 'dataLiberacao'])
@Index(['vendaId', 'contaReceberId'])
export class Comissao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    name: 'vendedor_id',
    nullable: false,
  })
  vendedorId: string;

  @Column({
    type: 'uuid',
    name: 'venda_id',
    nullable: false,
  })
  vendaId: string;

  @Column({
    type: 'uuid',
    name: 'conta_receber_id',
    nullable: true,
  })
  contaReceberId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Usuario;

  @ManyToOne(() => Venda)
  @JoinColumn({ name: 'venda_id' })
  venda: Venda;

  @ManyToOne(() => ContaReceber, { nullable: true })
  @JoinColumn({ name: 'conta_receber_id' })
  contaReceber: ContaReceber;

  @Column({
    type: 'enum',
    enum: TipoCalculoComissao,
    default: TipoCalculoComissao.PERCENTUAL_VENDA,
    name: 'tipo_calculo'
  })
  tipoCalculo: TipoCalculoComissao;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'base_calculo',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value ? parseFloat(value) : null,
    },
  })
  baseCalculo: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'percentual_aplicado',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value ? parseFloat(value) : null,
    },
  })
  percentualAplicado: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    name: 'valor_comissao',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorComissao: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'custo_operacional',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value ? parseFloat(value) : 0,
    },
  })
  custoOperacional: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'margem_liquida',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value ? parseFloat(value) : null,
    },
  })
  margemLiquida: number;

  @Column({
    type: 'enum',
    enum: StatusComissao,
    default: StatusComissao.PREVISTA,
  })
  status: StatusComissao;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'data_liberacao',
  })
  dataLiberacao: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'data_pagamento',
  })
  dataPagamento: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'pago_por_id',
  })
  pagoPorId: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'observacoes',
  })
  observacoes: string;

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

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'pago_por_id' })
  pagoPor: Usuario;
}