import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ContaPagar } from './contas_pagar.entity';
import { TipoDespesa } from '../enums/conta-pagar.enum';

@Entity({ name: 'categorias_despesa' })
export class CategoriaDespesa {
  @PrimaryColumn({
  type: 'char',
  length: 36,
  default: () => 'gen_random_uuid()',
})
id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({
    type: 'enum',
    enum: TipoDespesa,
    default: TipoDespesa.OUTRO,
  })
  tipo: TipoDespesa;

  @Column({ type: 'varchar', length: 7, nullable: true, comment: 'Hex color para UI (#FF5733)' })
  cor: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'Nome do ícone para frontend' })
  icone: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @OneToMany(() => ContaPagar, (conta) => conta.categoria)
  contas: ContaPagar[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}