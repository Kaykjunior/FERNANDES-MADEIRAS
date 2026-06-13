import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Licitacao } from './Licitacao.entity';
import { LicitacaoItem } from './Licitacao item.entity';

@Entity('licitacao_lotes')
export class LicitacaoLote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  licitacaoId: string;

  @ManyToOne(() => Licitacao, (l) => l.lotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'licitacaoId' })
  licitacao: Licitacao;

  @Column({ type: 'int' })
  numero: number;

  @Column({ nullable: true })
  descricao: string;

  // ── Dados do pregão ───────────────────────────────────────────────────────

  /** Melhor lance enviado por nós no pregão */
  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  meuLance: number;

  /** Lance do principal concorrente */
  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  lanceConcorrente: number;

  /** Preenchido após encerramento do lote */
  @Column({ type: 'boolean', nullable: true })
  ganhouLote: boolean;

  @OneToMany(() => LicitacaoItem, (item) => item.lote, { cascade: true, eager: false })
  itens: LicitacaoItem[];
}