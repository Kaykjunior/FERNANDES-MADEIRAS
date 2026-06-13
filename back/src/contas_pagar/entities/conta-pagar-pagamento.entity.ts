import {
  Entity, PrimaryColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { ContaPagar } from './contas_pagar.entity';
import { FormaPagamento } from '../enums/conta-pagar.enum';

const decimalTransformer = {
  to: (v: number) => v,
  from: (v: string) => (v != null ? parseFloat(v) : null),
};

@Entity({ name: 'contas_pagar_pagamentos' })
export class ContaPagarPagamento {
  @PrimaryColumn({
  type: 'char',
  length: 36,
  default: () => 'gen_random_uuid()',
})
id: string;

  @Column({ type: 'char', length: 36 })
  conta_id: string;

  @ManyToOne(() => ContaPagar, (c) => c.pagamentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conta_id' })
  conta: ContaPagar;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: decimalTransformer })
  valor: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  valor_desconto: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  valor_juros: number;

  @Column({ type: 'date' })
  data_pagamento: Date;

  @Column({ type: 'enum', enum: FormaPagamento })
  forma_pagamento: FormaPagamento;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Conta bancária utilizada' })
  conta_bancaria: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Comprovante/recibo' })
  comprovante_url: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'char', length: 36, nullable: true })
  usuario_id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}