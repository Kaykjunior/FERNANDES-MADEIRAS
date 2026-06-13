import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { LicitacaoLote } from './Licitacao lote.entity';

export enum StatusLicitacao {
  RASCUNHO    = 'RASCUNHO',
  ABERTA      = 'ABERTA',
  EM_PREGAO   = 'EM_PREGAO',
  FINALIZADA  = 'FINALIZADA',
  CANCELADA   = 'CANCELADA',
}

@Entity('licitacoes')
export class Licitacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Ex.: "Fornecimento de postes — Prefeitura de XYZ" */
  @Column()
  nome: string;

  /** Número do edital ou processo */
  @Column({ nullable: true })
  numeroEdital: string;

  /** Órgão comprador */
  @Column({ nullable: true })
  orgao: string;

  @Column({ type: 'date' })
  dataAbertura: Date;

  @Column({ type: 'date' })
  dataEncerramento: Date;

  @Column({ type: 'enum', enum: StatusLicitacao, default: StatusLicitacao.RASCUNHO })
  status: StatusLicitacao;

  // ── Custos globais a serem rateados por peso ──────────────────────────────
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  freteTotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  custoAdicional: number;

  // ── Margem mínima de lucro (%) usada para sugerir lance ideal ─────────────
  @Column('decimal', { precision: 5, scale: 2, default: 10 })
  margemMinimaPercent: number;

  // ── Resultado final ───────────────────────────────────────────────────────
  /** Preenchido manualmente após o pregão */
  @Column({ type: 'boolean', nullable: true })
  ganhou: boolean;

  /** Valor total do contrato assinado (se ganhou) */
  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  valorContratado: number;

  @Column({ nullable: true, length: 500 })
  observacoes: string;

  @OneToMany(() => LicitacaoLote, (lote) => lote.licitacao, { cascade: true, eager: false })
  lotes: LicitacaoLote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}