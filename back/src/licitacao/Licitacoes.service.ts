import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Licitacao, StatusLicitacao } from './entities/Licitacao.entity';
import { LicitacaoLote } from './entities/Licitacao lote.entity';
import { LicitacaoItem } from './entities/Licitacao item.entity';
import { Produto } from 'src/produtos/entities/produto.entity';

import {
    CreateLicitacaoDto,
    UpdateLanceDto,
    FinalizarLicitacaoDto,
} from './dto/Create licitacao.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Types internos dos cálculos
// ─────────────────────────────────────────────────────────────────────────────

interface ItemCalculado {
    itemId: string;
    produtoId: string;
    nomeProduto: string;
    quantidade: number;
    pesoPorUnidade: number;
    pesoTotal: number;
    precoReferencia: number;
    precoVendaBase: number;
    custoBase: number;
    ratioFrete: number;
    ratioCustoAdic: number;
    custoFinalTotal: number;
    custoUnitarioFinal: number;
    margemEstimadaPercent: number;
    lanceIdealUnitario: number;
    valorReferenciaTotal: number;
}

interface LoteCalculado {
    loteId: string;
    numero: number;
    descricao: string;
    meuLance: number | null;
    lanceConcorrente: number | null;
    ganhouLote: boolean | null;
    itensCalculados: ItemCalculado[];
    pesoTotalLote: number;
    custoTotalLote: number;
    valorReferencialLote: number;
    margemMediaLote: number;
    lanceIdealLote: number;
    lucroMeuLance: number | null;
    diferencaConcorrente: number | null;
    abaixoMinimo: boolean;
    alertaConcorrente: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class LicitacoesService {
    private readonly logger = new Logger(LicitacoesService.name);

    constructor(
        @InjectRepository(Licitacao)
        private readonly licitacaoRepo: Repository<Licitacao>,

        @InjectRepository(LicitacaoLote)
        private readonly loteRepo: Repository<LicitacaoLote>,

        @InjectRepository(LicitacaoItem)
        private readonly itemRepo: Repository<LicitacaoItem>,

        @InjectRepository(Produto)
        private readonly produtoRepo: Repository<Produto>,

        private readonly dataSource: DataSource,
    ) { }

    // =========================================================
    // CREATE
    // =========================================================
    async create(dto: CreateLicitacaoDto): Promise<Licitacao> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { manager } = queryRunner;

            const licitacao = manager.create(Licitacao, {
                nome: dto.nome,
                numeroEdital: dto.numeroEdital,
                orgao: dto.orgao,
                dataAbertura: dto.dataAbertura as any,
                dataEncerramento: dto.dataEncerramento as any,
                status: dto.status ?? StatusLicitacao.RASCUNHO,
                freteTotal: dto.freteTotal ?? 0,
                custoAdicional: dto.custoAdicional ?? 0,
                margemMinimaPercent: dto.margemMinimaPercent ?? 10,
                observacoes: dto.observacoes,
            });

            const licitacaoSalva = await manager.save(licitacao);

            for (const loteDto of dto.lotes) {
                const lote = manager.create(LicitacaoLote, {
                    licitacao: { id: licitacaoSalva.id },
                    numero: loteDto.numero,
                    descricao: loteDto.descricao,
                    meuLance: loteDto.meuLance ?? null,
                    lanceConcorrente: loteDto.lanceConcorrente ?? null,
                    ganhouLote: loteDto.ganhouLote ?? null,
                } as Partial<LicitacaoLote>);

                const loteSalvo = await manager.save(lote);

                for (const itemDto of loteDto.itens) {
                    const produto = await manager.findOne(Produto, {
                        where: { id: itemDto.produtoId },
                    });

                    if (!produto) {
                        throw new NotFoundException(
                            `Produto ${itemDto.produtoId} não encontrado`,
                        );
                    }

                    const item = manager.create(LicitacaoItem, {
                        lote: { id: loteSalvo.id },
                        produto: { id: produto.id },
                        quantidade: itemDto.quantidade,
                        precoReferencia: itemDto.precoReferencia,
                    });

                    await manager.save(item);
                }
            }

            await queryRunner.commitTransaction();
            return this.findOne(licitacaoSalva.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Rollback ao criar licitação: ${error}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // =========================================================
    async findAll(): Promise<Licitacao[]> {
        return this.licitacaoRepo.find({
            order: { dataAbertura: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Licitacao> {
        const licitacao = await this.licitacaoRepo.findOne({
            where: { id },
            relations: ['lotes', 'lotes.itens', 'lotes.itens.produto'],
        });

        if (!licitacao) {
            throw new NotFoundException(`Licitação ${id} não encontrada`);
        }

        return licitacao;
    }

    async update(id: string, dto: Partial<CreateLicitacaoDto>): Promise<Licitacao> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { manager } = queryRunner;

            const licitacao = await manager.findOne(Licitacao, {
                where: { id },
                relations: ['lotes', 'lotes.itens'],
            });

            if (!licitacao) throw new NotFoundException(`Licitação ${id} não encontrada`);

            Object.assign(licitacao, {
                nome: dto.nome ?? licitacao.nome,
                numeroEdital: dto.numeroEdital ?? licitacao.numeroEdital,
                orgao: dto.orgao ?? licitacao.orgao,
                dataAbertura: dto.dataAbertura ?? licitacao.dataAbertura,
                dataEncerramento: dto.dataEncerramento ?? licitacao.dataEncerramento,
                status: dto.status ?? licitacao.status,
                freteTotal: dto.freteTotal ?? licitacao.freteTotal,
                custoAdicional: dto.custoAdicional ?? licitacao.custoAdicional,
                margemMinimaPercent: dto.margemMinimaPercent ?? licitacao.margemMinimaPercent,
                observacoes: dto.observacoes ?? licitacao.observacoes,
            });

            await manager.save(licitacao);

            // Se vieram lotes no DTO, substitui completamente
            if (dto.lotes !== undefined) {
                for (const loteAntigo of licitacao.lotes) {
                    await manager.delete(LicitacaoItem, { lote: { id: loteAntigo.id } });
                    await manager.delete(LicitacaoLote, { id: loteAntigo.id });
                }

                for (const loteDto of dto.lotes) {
                    const lote = manager.create(LicitacaoLote, {
                        licitacao: { id },
                        numero: loteDto.numero,
                        descricao: loteDto.descricao,
                        meuLance: loteDto.meuLance ?? null,
                        lanceConcorrente: loteDto.lanceConcorrente ?? null,
                        ganhouLote: loteDto.ganhouLote ?? null,
                    } as Partial<LicitacaoLote>);

                    const loteSalvo = await manager.save(lote);

                    for (const itemDto of loteDto.itens) {
                        const item = manager.create(LicitacaoItem, {
                            lote: { id: loteSalvo.id },
                            produto: { id: itemDto.produtoId },
                            quantidade: itemDto.quantidade,
                            precoReferencia: itemDto.precoReferencia,
                        });
                        await manager.save(item);
                    }
                }
            }

            await queryRunner.commitTransaction();
            return this.findOne(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async remove(id: string): Promise<void> {
        const licitacao = await this.findOne(id);
        await this.licitacaoRepo.remove(licitacao);
    }

    async atualizarStatus(id: string, status: StatusLicitacao): Promise<Licitacao> {
        const licitacao = await this.findOne(id);
        licitacao.status = status;
        await this.licitacaoRepo.save(licitacao);
        return this.findOne(id);
    }

    // =========================================================
    // PREGÃO
    // =========================================================
    async updateLance(loteId: string, dto: UpdateLanceDto): Promise<LicitacaoLote> {
        const lote = await this.loteRepo.findOne({ where: { id: loteId } });

        if (!lote) throw new NotFoundException(`Lote ${loteId} não encontrado`);

        if (dto.meuLance !== undefined) lote.meuLance = dto.meuLance;
        if (dto.lanceConcorrente !== undefined) lote.lanceConcorrente = dto.lanceConcorrente;
        if (dto.ganhouLote !== undefined) lote.ganhouLote = dto.ganhouLote;

        return this.loteRepo.save(lote);
    }

    async finalizar(id: string, dto: FinalizarLicitacaoDto): Promise<Licitacao> {
        const licitacao = await this.findOne(id);

        licitacao.ganhou = dto.ganhou;
        if (dto.valorContratado !== undefined) {
            licitacao.valorContratado = dto.valorContratado;
        }
        licitacao.observacoes = dto.observacoes ?? licitacao.observacoes;
        licitacao.status = StatusLicitacao.FINALIZADA;

        await this.licitacaoRepo.save(licitacao);
        return this.findOne(id);
    }

    // =========================================================
    // CÁLCULOS
    // =========================================================

    /**
     * Retorna a licitação com todos os cálculos de rateio por peso.
     *
     * FÓRMULAS:
     *   pesoItem      = quantidade × peso_unitario_kg
     *   pesoTotal     = Σ pesoItem  (todos os itens de todos os lotes)
     *   ratioFrete    = (pesoItem / pesoTotal) × freteTotal
     *   ratioAdic     = (pesoItem / pesoTotal) × custoAdicional
     *   custoBase     = quantidade × preco_venda_base
     *   custoFinal    = custoBase + ratioFrete + ratioAdic
     *   custoUnitFin  = custoFinal / quantidade
     *   margemEst     = (preçoRef − custoUnitFin) / preçoRef × 100
     *   lanceIdeal    = custoUnitFin × (1 + margemMinima / 100)
     */
    async calcular(id: string): Promise<any> {
        const licitacao = await this.findOne(id);

        const freteTotal = Number(licitacao.freteTotal ?? 0);
        const custoAdicional = Number(licitacao.custoAdicional ?? 0);
        const margemMinima = Number(licitacao.margemMinimaPercent ?? 10);

        // 1. Peso total geral (todos os itens de todos os lotes)
        const todosItens: { item: LicitacaoItem; produto: Produto }[] = [];

        for (const lote of licitacao.lotes) {
            for (const item of lote.itens) {
                if (item.produto) {
                    todosItens.push({ item, produto: item.produto });
                }
            }
        }

        const pesoTotalGeral = todosItens.reduce(
            (sum, { item, produto }) =>
                sum + Number(item.quantidade) * Number(produto.peso_unitario_kg),
            0,
        );

        // 2. Calcula por lote e por item
        const lotesCalculados: LoteCalculado[] = licitacao.lotes.map((lote) => {
            const itensCalculados: ItemCalculado[] = lote.itens
                .filter((item) => !!item.produto)
                .map((item) => {
                    const produto = item.produto;
                    const qtd = Number(item.quantidade);
                    const pesoUnit = Number(produto.peso_unitario_kg);
                    const pesoItem = qtd * pesoUnit;

                    const proporcao = pesoTotalGeral > 0 ? pesoItem / pesoTotalGeral : 0;

                    const ratioFrete = proporcao * freteTotal;
                    const ratioCustoAdic = proporcao * custoAdicional;

                    const custoBase = qtd * Number(produto.preco_venda_base);
                    const custoFinalTotal = custoBase + ratioFrete + ratioCustoAdic;
                    const custoUnitFin = qtd > 0 ? custoFinalTotal / qtd : 0;

                    const precoRef = Number(item.precoReferencia);
                    const margemEst =
                        precoRef > 0 ? ((precoRef - custoUnitFin) / precoRef) * 100 : 0;

                    const lanceIdealUnitario = custoUnitFin * (1 + margemMinima / 100);

                    return {
                        itemId: item.id,
                        produtoId: produto.id,
                        nomeProduto: produto.nome,
                        quantidade: qtd,
                        pesoPorUnidade: pesoUnit,
                        pesoTotal: pesoItem,
                        precoReferencia: precoRef,
                        precoVendaBase: Number(produto.preco_venda_base),
                        custoBase,
                        ratioFrete,
                        ratioCustoAdic,
                        custoFinalTotal,
                        custoUnitarioFinal: custoUnitFin,
                        margemEstimadaPercent: margemEst,
                        lanceIdealUnitario,
                        valorReferenciaTotal: precoRef * qtd,
                    };
                });

            const custoTotalLote = itensCalculados.reduce(
                (s, i) => s + i.custoFinalTotal, 0,
            );
            const valorReferencialLote = itensCalculados.reduce(
                (s, i) => s + i.valorReferenciaTotal, 0,
            );
            const pesoTotalLote = itensCalculados.reduce(
                (s, i) => s + i.pesoTotal, 0,
            );
            const margemMediaLote =
                itensCalculados.length > 0
                    ? itensCalculados.reduce((s, i) => s + i.margemEstimadaPercent, 0) /
                    itensCalculados.length
                    : 0;
            const lanceIdealLote = itensCalculados.reduce(
                (s, i) => s + i.lanceIdealUnitario * i.quantidade,
                0,
            );

            const meuLanceN = lote.meuLance ? Number(lote.meuLance) : null;
            const lanceConcorrenteN = lote.lanceConcorrente
                ? Number(lote.lanceConcorrente)
                : null;

            const lucroMeuLance =
                meuLanceN !== null ? meuLanceN - custoTotalLote : null;
            const diferencaConcorrente =
                meuLanceN !== null && lanceConcorrenteN !== null
                    ? meuLanceN - lanceConcorrenteN
                    : null;

            return {
                loteId: lote.id,
                numero: lote.numero,
                descricao: lote.descricao ?? `Lote ${lote.numero}`,
                meuLance: meuLanceN,
                lanceConcorrente: lanceConcorrenteN,
                ganhouLote: lote.ganhouLote ?? null,
                itensCalculados,
                pesoTotalLote,
                custoTotalLote,
                valorReferencialLote,
                margemMediaLote,
                lanceIdealLote,
                lucroMeuLance,
                diferencaConcorrente,
                abaixoMinimo: meuLanceN !== null && meuLanceN < lanceIdealLote,
                alertaConcorrente:
                    diferencaConcorrente !== null && diferencaConcorrente > 0,
            };
        });

        const custoTotalGeral = lotesCalculados.reduce(
            (s, l) => s + l.custoTotalLote, 0,
        );
        const valorReferencialGeral = lotesCalculados.reduce(
            (s, l) => s + l.valorReferencialLote, 0,
        );
        const margemMediaGeral =
            lotesCalculados.length > 0
                ? lotesCalculados.reduce((s, l) => s + l.margemMediaLote, 0) /
                lotesCalculados.length
                : 0;

        return {
            licitacao,
            lotesCalculados,
            pesoTotalGeral,
            custoTotalGeral,
            valorReferencialGeral,
            margemMediaGeral,
        };
    }

    // =========================================================
    // DASHBOARD
    // =========================================================
    async getDashboard(): Promise<any> {
        const todas = await this.licitacaoRepo.find({
            order: { dataAbertura: 'DESC' },
        });

        const total = todas.length;
        const ganhas = todas.filter((l) => l.ganhou === true).length;
        const perdidas = todas.filter((l) => l.ganhou === false).length;
        const taxaSucesso = total > 0 ? (ganhas / total) * 100 : 0;

        const valorGanho = todas
            .filter((l) => l.ganhou === true)
            .reduce((s, l) => s + Number(l.valorContratado ?? 0), 0);

        const hoje = new Date();

        // Adiciona diasRestantes a cada licitação
        const licitacoes = todas.map((l) => {
            const encerramento = new Date(l.dataEncerramento);
            const diasRestantes = Math.ceil(
                (encerramento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
            );
            return { ...l, diasRestantes };
        });

        // Evolução mensal de ganhos — agrupa por "YYYY-MM"
        const evolucaoMap: Record<string, number> = {};

        for (const l of todas) {
            if (l.ganhou === true && l.valorContratado) {
                const key = new Date(l.dataAbertura).toISOString().slice(0, 7);
                evolucaoMap[key] = (evolucaoMap[key] ?? 0) + Number(l.valorContratado);
            }
        }

        const evolucaoGanhos = Object.entries(evolucaoMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([mes, valor]) => ({ mes, valor }));

        return {
            resumo: { total, ganhas, perdidas, taxaSucesso, valorGanho },
            licitacoes,
            evolucaoGanhos,
        };
    }
}