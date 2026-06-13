import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Produto } from 'src/produtos/entities/produto.entity';

@Entity('estoque')
export class Estoque {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Produto, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;

  @Column({ type: 'int', default: 0 })
  quantidade: number;

  @Column({ type: 'int', default: 0, name: 'quantidade_reservada' })
  quantidadeReservada: number;

  @Column({ 
    type: 'decimal', 
    precision: 12, 
    scale: 2, 
    nullable: true,
    name: 'custo_medio',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  custoMedio: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  localizacao: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get quantidadeDisponivel(): number {
    return (this.quantidade || 0) - (this.quantidadeReservada || 0);
  }
}