import { Produto } from "src/produtos/entities/produto.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string; // EX: POSTES, PEÇAS, RIPAS

  @Column({ length: 8, nullable: true })
  ncm_padrao: string;

  @Column({ default: true })
  ativo: boolean;

  @OneToMany(() => Produto, (produto) => produto.categoria)
  produtos: Produto[];
}
