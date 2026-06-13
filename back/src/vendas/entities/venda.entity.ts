import {
  Entity,
  Column,
  PrimaryGeneratedColumn, // Mude para PrimaryGeneratedColumn
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Entidade } from '../../entidades/entities/entidade.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Romaneio } from '../../romaneios/entities/romaneio.entity';
import { ContaReceber } from 'src/contas_receber/entities/contas_receber.entity';
import { Comissao } from 'src/comissoes/entities/comissoe.entity';
import { VendaItem } from 'src/venda_itens/entities/venda_iten.entity';
import { FormasPagamento } from 'src/formas_pagamento/entities/formas_pagamento.entity';

export enum StatusVenda {
  ORCAMENTO = 'ORCAMENTO',
  APROVADO = 'APROVADO',
  EM_SEPARACAO = 'EM_SEPARACAO',
  ENVIADO = 'ENVIADO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO'
}

export enum StatusPagamento {
  PAGO = 'PAGO',
  AGUARDANDO = 'AGUARDANDO',
  CANCELADO = 'CANCELADO',
  FATURADO = 'FATURADO'
}

export enum StatusSefaz {
  NAO_EMITIDA = 'NAO_EMITIDA',
  AUTORIZADA = 'AUTORIZADA',
  REJEITADA = 'REJEITADA',
  CANCELADA = 'CANCELADA',
  DENEGADA = 'DENEGADA'
}

@Entity('vendas')
export class Venda {
  // PARA POSTGRESQL: PrimaryGeneratedColumn com 'uuid'
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'int',
    unique: true,
    nullable: true,
    name: 'numero_pedido',
  })
  numeroPedido: number;

  // CORREÇÃO: Use 'uuid' SEM 'length'
  @Column({
    type: 'uuid',
    name: 'cliente_id',
  })
  clienteId: string;

  @Column({
    type: 'uuid',
    name: 'vendedor_id',
  })
  vendedorId: string;

  @Column({
    type: 'uuid',
    name: 'romaneio_id',
    nullable: true,
  })
  romaneioId: string;

  @Column({
    type: 'int',
    name: 'forma_pagamento_id',
    nullable: false,
  })
  formaPagamentoId: number;


  @ManyToOne(() => Entidade)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Entidade;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Usuario;

  @ManyToOne(() => Romaneio, { nullable: true })
  @JoinColumn({ name: 'romaneio_id' })
  romaneio: Romaneio;

  // Adicione esta relação
  @ManyToOne(() => FormasPagamento, { nullable: true })
  @JoinColumn({ name: 'forma_pagamento_id' })
  formaPagamento: FormasPagamento;

  @OneToMany(() => VendaItem, (item) => item.venda, { cascade: true })
  itens: VendaItem[];

  @OneToMany(() => ContaReceber, (conta) => conta.venda)
  contasReceber: ContaReceber[];

  @OneToMany(() => Comissao, (comissao) => comissao.venda)
  comissoes: Comissao[];

  @Column({
    type: 'enum',
    enum: StatusVenda,
    default: StatusVenda.ORCAMENTO,
    name: 'status_venda',
  })
  statusVenda: StatusVenda;

  @Column({
    type: 'enum',
    enum: StatusPagamento,
    default: StatusPagamento.AGUARDANDO,
  })
  status: StatusPagamento;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.00,
    name: 'valor_produtos',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorProdutos: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.00,
    name: 'valor_frete',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorFrete: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.00,
    name: 'valor_seguro',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorSeguro: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.00,
    name: 'valor_desconto',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorDesconto: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.00,
    name: 'valor_outras_despesas',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorOutrasDespesas: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.00,
    name: 'valor_total',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valorTotal: number;

  @Column({
    type: 'varchar',
    length: 2,
    default: '55',
    name: 'modelo_nf',
  })
  modeloNf: string;

  @Column({
    type: 'varchar',
    length: 3,
    name: 'serie_nf',
    nullable: true,
  })
  serieNf: string;

  @Column({
    type: 'int',
    name: 'numero_nf',
    nullable: true,
  })
  numeroNf: number;

  @Column({
    type: 'varchar',
    length: 44,
    name: 'chave_acesso_nfe',
    nullable: true,
  })
  chaveAcessoNfe: string;

  @Index('idx_status_venda')
  @Column({
    type: 'enum',
    enum: StatusSefaz,
    default: StatusSefaz.NAO_EMITIDA,
    name: 'status_sefaz',
  })
  statusSefaz: StatusSefaz;

  @Column({
    type: 'timestamp',
    name: 'data_emissao_nfe',
    nullable: true,
  })
  dataEmissaoNfe: Date;

  @Column({
    type: 'text',
    name: 'xml_autorizado',
    nullable: true,
  })
  xmlAutorizado: string | null;

  @Column({
    type: 'text',
    name: 'observacoes_fisco',
    nullable: true,
  })
  observacoesFisco: string;

  @Column({
    type: 'text',
    name: 'observacoes_cliente',
    nullable: true,
  })
  observacoesCliente: string;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
