import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Venda } from '../../vendas/entities/venda.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { Lote } from '../../lotes/entities/lote.entity';

@Entity('venda_itens')
export class VendaItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // CORREÇÃO: Use 'uuid' SEM 'length'
    @Column({
        type: 'uuid',
        name: 'venda_id',
    })
    vendaId: string;

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
    loteId: string;

    @ManyToOne(() => Venda, (venda) => venda.itens, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'venda_id' })
    venda: Venda;

    @ManyToOne(() => Produto)
    @JoinColumn({ name: 'produto_id' })
    produto: Produto;

    @ManyToOne(() => Lote, { nullable: true })
    @JoinColumn({ name: 'lote_id' })
    lote: Lote;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 3,
        nullable: false,
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
        nullable: false,
        name: 'valor_unitario',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    valorUnitario: number;

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
        name: 'valor_frete_item',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    valorFreteItem: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: false,
        name: 'valor_subtotal',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    valorSubtotal: number;

    @Column({
        type: 'varchar',
        length: 4,
        nullable: false,
    })
    cfop: string;

    @Column({
        type: 'varchar',
        length: 3,
        name: 'cst_icms',
        nullable: true,
    })
    cstIcms: string;

    @Column({
        type: 'varchar',
        length: 2,
        name: 'cst_pis',
        nullable: true,
    })
    cstPis: string;

    @Column({
        type: 'varchar',
        length: 2,
        name: 'cst_cofins',
        nullable: true,
    })
    cstCofins: string;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.00,
        name: 'base_icms',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    baseIcms: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.00,
        name: 'valor_icms',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    valorIcms: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0.00,
        name: 'aliq_icms',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    aliqIcms: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.00,
        name: 'base_pis',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    basePis: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.00,
        name: 'valor_pis',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    valorPis: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.00,
        name: 'base_cofins',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    baseCofins: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.00,
        name: 'valor_cofins',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    valorCofins: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.00,
        name: 'valor_ipi',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    valorIpi: number;
}
