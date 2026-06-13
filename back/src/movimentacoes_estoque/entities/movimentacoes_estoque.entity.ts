import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn,
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { Produto } from 'src/produtos/entities/produto.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Lote } from 'src/lotes/entities/lote.entity';
import { VendaItem } from 'src/venda_itens/entities/venda_iten.entity';

export enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  AJUSTE = 'AJUSTE',
  TRANSFERENCIA = 'TRANSFERENCIA'
}

@Entity('movimentacoes_estoque')
export class MovimentacaoEstoque {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TipoMovimentacao,
  })
  tipo: TipoMovimentacao;

  @Column({
    type: 'uuid',
    name: 'produto_id',
  })
  produtoId: string;

  @Column({
    type: 'uuid',
    name: 'lote_id',
    nullable: true,
  })
  loteId?: string;

  @Column({
    type: 'uuid',
    name: 'venda_item_id',
    nullable: true,
  })
  vendaItemId?: string;

  @Column({
    type: 'uuid',
    name: 'usuario_id',
  })
  usuarioId: string;

  @Column({
    type: 'int',
  })
  quantidade: number;

  @Column({
    type: 'varchar',
    length: 200,
  })
  motivo: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  observacoes?: string;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto?: Produto;

  @ManyToOne(() => Lote, { nullable: true })
  @JoinColumn({ name: 'lote_id' })
  lote?: Lote;

  @ManyToOne(() => VendaItem, { nullable: true })
  @JoinColumn({ name: 'venda_item_id' })
  vendaItem?: VendaItem;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

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