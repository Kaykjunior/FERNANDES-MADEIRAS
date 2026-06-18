import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TabelaPrecoItem } from './tabela preco item.entity';

@Entity('tabelas_preco')
export class TabelaPreco {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ unique: true })
  nome?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  // Ex: 'TRATADA', 'IN_NATURA', 'ESPECIAL' -> usado para identificar o "tipo" da tabela
  tipo?: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ default: true })
  ativo?: boolean;

  @Column({ default: false })
  // Define a tabela utilizada como padrão ao iniciar um novo pedido
  padrao?: boolean;

  @OneToMany(() => TabelaPrecoItem, (item) => item.tabelaPreco, {
    cascade: true,
  })
  itens?: TabelaPrecoItem[];

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}