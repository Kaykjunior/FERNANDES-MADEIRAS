import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Venda } from '../../vendas/entities/venda.entity';

@Entity({ name: 'formas_pagamento' })
export class FormasPagamento {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  nome: string; // Dinheiro, Pix, Cartão Crédito

  @Column({
    type: 'varchar',
    length: 2,
    nullable: true,
    name: 'codigo_sefaz',
  })
  codigoSefaz: string; // 01=Dinheiro, 17=Pix (Para XML da NFe)

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0.00,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
    name: 'taxa_adm',
  })
  taxaAdm: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'dias_recebimento',
  })
  diasRecebimento: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  ativo: boolean;

  // Adicione esta relação
  @OneToMany(() => Venda, (venda) => venda.formaPagamento)
  vendas: Venda[];
}