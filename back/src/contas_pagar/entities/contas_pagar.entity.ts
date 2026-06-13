import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { CategoriaDespesa } from './categoria-despesa.entity';
import { ContaPagarParcela } from './conta-pagar-parcela.entity';
import { ContaPagarPagamento } from './conta-pagar-pagamento.entity';
import {
  StatusContaPagar,
  FormaPagamento,
  TipoRecorrencia,
} from '../enums/conta-pagar.enum';

const decimalTransformer = {
  to: (v: number) => v,
  from: (v: string) => (v != null ? parseFloat(v) : null),
};

@Entity({ name: 'contas_pagar' })
export class ContaPagar {
  @PrimaryColumn({
  type: 'char',
  length: 36,
  default: () => 'gen_random_uuid()',  // ← era UUID()
})
id: string;

  // ─── Identificação ───────────────────────────────────────────────
  @Column({ type: 'varchar', length: 255 })
  descricao: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Nº nota fiscal / boleto / contrato' })
  numero_documento: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Nome do fornecedor / beneficiário' })
  beneficiario: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  // ─── Valores ─────────────────────────────────────────────────────
  @Column({
    type: 'decimal', precision: 12, scale: 2,
    transformer: decimalTransformer,
  })
  valor_total: number;

  @Column({
    type: 'decimal', precision: 12, scale: 2, default: 0.00,
    transformer: decimalTransformer,
  })
  valor_pago: number;

  @Column({
    type: 'decimal', precision: 12, scale: 2, default: 0.00,
    transformer: decimalTransformer,
    comment: 'valor_total - valor_pago (calculado automaticamente)',
  })
  valor_aberto: number;

  @Column({
    type: 'decimal', precision: 12, scale: 2, nullable: true,
    transformer: decimalTransformer,
    comment: 'Desconto concedido',
  })
  valor_desconto: number;

  @Column({
    type: 'decimal', precision: 12, scale: 2, nullable: true,
    transformer: decimalTransformer,
    comment: 'Juros/multa por atraso',
  })
  valor_juros: number;

  // ─── Datas ────────────────────────────────────────────────────────
  @Column({ type: 'date' })
  data_vencimento: Date;

  @Column({ type: 'date', nullable: true, comment: 'Mês de competência da despesa' })
  data_competencia: Date;

  @Column({ type: 'date', nullable: true })
  data_pagamento: Date;

  // ─── Status e forma ──────────────────────────────────────────────
  @Column({ type: 'enum', enum: StatusContaPagar, default: StatusContaPagar.PENDENTE })
  status: StatusContaPagar;

  @Column({ type: 'enum', enum: FormaPagamento, nullable: true })
  forma_pagamento: FormaPagamento;

  // ─── Centro de custo / conta bancária ────────────────────────────
  @Column({ type: 'varchar', length: 100, nullable: true })
  centro_custo: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Conta bancária debitada' })
  conta_bancaria: string;

  // ─── Parcelamento ────────────────────────────────────────────────
  @Column({ type: 'int', default: 1 })
  numero_parcelas: number;

  @Column({ type: 'int', nullable: true, comment: 'Número desta parcela (ex: 2/6)' })
  parcela_atual: number;

  // ─── Recorrência ─────────────────────────────────────────────────
  @Column({ type: 'boolean', default: false })
  recorrente: boolean;

  @Column({ type: 'enum', enum: TipoRecorrencia, nullable: true })
  tipo_recorrencia: TipoRecorrencia;

  @Column({ type: 'date', nullable: true, comment: 'Data final da recorrência' })
  recorrencia_fim: Date;

  @Column({ type: 'char', length: 36, nullable: true, comment: 'ID da conta pai em recorrências' })
  conta_pai_id: string;

  // ─── Relacionamentos ─────────────────────────────────────────────
  @Column({ type: 'char', length: 36, nullable: true })
  categoria_id: string;

  @ManyToOne(() => CategoriaDespesa, (cat) => cat.contas, { nullable: true, eager: false })
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaDespesa;

  @OneToMany(() => ContaPagarParcela, (p) => p.conta, { cascade: true })
  parcelas: ContaPagarParcela[];

  @OneToMany(() => ContaPagarPagamento, (p) => p.conta, { cascade: true })
  pagamentos: ContaPagarPagamento[];

  // ─── Anexo ───────────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'URL do comprovante/NF' })
  anexo_url: string;

  // ─── Auditoria ───────────────────────────────────────────────────
  @Column({ type: 'char', length: 36, nullable: true })
  usuario_id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}