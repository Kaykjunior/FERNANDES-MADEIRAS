import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Estoque } from 'src/estoque/entities/estoque.entity';
import { TabelaPrecoItem } from 'src/tabelas-preco/entities/tabela preco item.entity';

@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ unique: true }) // <--- ADICIONE O UNIQUE AQUI
  nome?: string;

  @Column({ unique: true, nullable: true })
  codigo_sku?: string;

  // Campo físico para aceitar o ID do Insomnia
 @Column({ name: 'categoria_id', nullable: true })
  categoria_id?: number;

  @ManyToOne(() => Categoria, (cat) => cat.produtos, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoria_id' })
  categoria?: Categoria;

  @OneToMany(() => Estoque, (estoque) => estoque.produto)
  estoque?: Estoque[];

  // Preços do produto em cada Tabela de Preços (Tratada, In Natura, Especial, etc.)
  @OneToMany(() => TabelaPrecoItem, (item) => item.produto)
  tabelaPrecoItens?: TabelaPrecoItem[];

  @Column({ length: 15, nullable: true })
  dimensao_ripa?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  comprimento_mt?: number;

  @Column({ type: 'int', nullable: true }) // Adicione o nullable: true
  diametro_min?: number;

  @Column({ type: 'int', nullable: true }) // Adicione o nullable: true
  diametro_max?: number;

  @Column('decimal', { precision: 10, scale: 3 })
  peso_unitario_kg?: number;

  // Preço base "de referência" do produto (usado como fallback e no cadastro).
  // As vendas devem utilizar o preço definido na Tabela de Preços selecionada.
  @Column('decimal', { precision: 12, scale: 2 })
  preco_venda_base?: number;

  @Column({ length: 6, default: 'UN' })
  unidade_comercial?: string;

  @Column({ length: 8 })
  ncm?: string;

  @Column({ default: true })
  ativo?: boolean;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}