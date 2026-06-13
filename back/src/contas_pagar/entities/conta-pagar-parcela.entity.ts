import {
  Entity, PrimaryColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { ContaPagar } from './contas_pagar.entity';
import { StatusContaPagar } from '../enums/conta-pagar.enum';

const decimalTransformer = {
  to: (v: number) => v,
  from: (v: string) => (v != null ? parseFloat(v) : null),
};

@Entity({ name: 'contas_pagar_parcelas' })
export class ContaPagarParcela {
  @PrimaryColumn({
  type: 'char',
  length: 36,
  default: () => 'gen_random_uuid()',
})
id: string;

  @Column({ type: 'char', length: 36 })
  conta_id: string;

  @ManyToOne(() => ContaPagar, (c) => c.parcelas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conta_id' })
  conta: ContaPagar;

  @Column({ type: 'int', comment: 'Número sequencial (1, 2, 3...)' })
  numero: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: decimalTransformer })
  valor: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  valor_pago: number;

  @Column({ type: 'date' })
  data_vencimento: Date;

  @Column({ type: 'date', nullable: true })
  data_pagamento: Date;

  @Column({ type: 'enum', enum: StatusContaPagar, default: StatusContaPagar.PENDENTE })
  status: StatusContaPagar;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}