import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TabelaPreco } from './tabela preco.entity';
import { Produto } from '../../produtos/entities/produto.entity';

/**
 * Representa o preço de um produto específico dentro de uma tabela de preços.
 * Um mesmo produto pode existir em N tabelas, cada uma com seu próprio preço.
 */
@Entity('tabela_preco_itens')
@Unique(['tabelaPreco', 'produto'])
export class TabelaPrecoItem {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ name: 'tabela_preco_id' })
  tabelaPrecoId?: string;

  @ManyToOne(() => TabelaPreco, (tabela) => tabela.itens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tabela_preco_id' })
  tabelaPreco?: TabelaPreco;

  @Column({ name: 'produto_id' })
  produtoId?: string;

  @ManyToOne(() => Produto, (produto) => produto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'produto_id' })
  produto?: Produto;

  // Preço do produto especificamente nesta tabela.
  @Column('decimal', { precision: 12, scale: 2 })
  preco?: number;

  @Column({ default: true })
  ativo?: boolean;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}