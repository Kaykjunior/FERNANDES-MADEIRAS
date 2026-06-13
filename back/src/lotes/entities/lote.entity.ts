import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Produto } from '../../produtos/entities/produto.entity';

@Entity('lotes')
export class Lote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  codigo: string;

  @Column({ type: 'uuid', name: 'produto_id' })
  produtoId: string;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;

  @Column({ 
    type: 'decimal', 
    precision: 12, 
    scale: 3,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  quantidade: number;

  @Column({ 
    type: 'decimal', 
    precision: 12, 
    scale: 2,
    name: 'valor_compra',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorCompra: number;

  @Column({ type: 'date', name: 'data_fabricacao', nullable: true })
  dataFabricacao: Date;

  @Column({ type: 'date', name: 'data_validade', nullable: true })
  dataValidade: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
