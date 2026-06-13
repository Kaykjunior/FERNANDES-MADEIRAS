import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE',
  VENDEDOR = 'VENDEDOR',
  ESTOQUISTA = 'ESTOQUISTA',
  FINANCEIRO = 'FINANCEIRO',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  // select: false impede que a senha venha em consultas normais (segurança)
  @Column({ name: 'senha_hash', select: false }) 
  @Exclude() // Garante que não saia no JSON
  senhaHash: string;

  @Column({ 
    type: 'enum', 
    enum: UserRole, 
    default: UserRole.VENDEDOR 
  })
  cargo: UserRole;

  @Column({ name: 'comissao_percentual', type: 'numeric', precision: 5, scale: 2, default: 0 })
  comissaoPercentual: number;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Campo virtual para receber a senha crua no cadastro
  senha?: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.senha) {
      const salt = await bcrypt.genSalt();
      this.senhaHash = await bcrypt.hash(this.senha, salt);
    }
  }
}
