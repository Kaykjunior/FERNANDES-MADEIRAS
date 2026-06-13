import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'caixa' })
export class Caixa {
  @PrimaryColumn({
    type: 'varchar',
    length: 50,
  })
  id: string; // Ex: 'PRINCIPAL', 'COFRE'

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0.00,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
    name: 'saldo_atual',
  })
  saldoAtual: number;

  @Column({
    type: 'timestamp', // MUDE para 'timestamp' (PostgreSQL não tem 'datetime')
    name: 'ultima_atualizacao',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  ultimaAtualizacao: Date;
}
