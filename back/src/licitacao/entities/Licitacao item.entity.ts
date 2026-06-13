import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { LicitacaoLote } from './Licitacao lote.entity';
import { Produto } from 'src/produtos/entities/produto.entity';

@Entity('licitacao_itens')
export class LicitacaoItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loteId: string;

  @ManyToOne(() => LicitacaoLote, (lote) => lote.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loteId' })
  lote: LicitacaoLote;

  @Column()
  produtoId: string;

  @ManyToOne(() => Produto, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'produtoId' })
  produto: Produto;

  /** Quantidade exigida no edital para este item */
  @Column('decimal', { precision: 12, scale: 3 })
  quantidade: number;

  /**
   * Preço de referência (teto) estipulado no edital para a UNIDADE do item.
   * Serve como base para cálculo de margem.
   */
  @Column('decimal', { precision: 12, scale: 2 })
  precoReferencia: number;
}