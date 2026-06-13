import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  Between,
  FindOptionsWhere,
  Not,
} from 'typeorm';
import { addMonths, addDays, addWeeks, isAfter, startOfDay } from 'date-fns';

import { ContaPagar } from './entities/contas_pagar.entity';
import { ContaPagarParcela } from './entities/conta-pagar-parcela.entity';
import { ContaPagarPagamento } from './entities/conta-pagar-pagamento.entity';
import { CategoriaDespesa } from './entities/categoria-despesa.entity';
import { CreateContasPagarDto } from './dto/create-contas_pagar.dto';
import { UpdateContasPagarDto } from './dto/update-contas_pagar.dto';
import { FilterContasPagarDto } from './dto/filter-contas-pagar.dto';
import { RegistrarPagamentoDto } from './dto/registrar-pagamento.dto';
import { StatusContaPagar, TipoRecorrencia } from './enums/conta-pagar.enum';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ContasPagarService {
  constructor(
    @InjectRepository(ContaPagar)
    private readonly contaRepo: Repository<ContaPagar>,

    @InjectRepository(ContaPagarParcela)
    private readonly parcelaRepo: Repository<ContaPagarParcela>,

    @InjectRepository(ContaPagarPagamento)
    private readonly pagamentoRepo: Repository<ContaPagarPagamento>,

    @InjectRepository(CategoriaDespesa)
    private readonly categoriaRepo: Repository<CategoriaDespesa>,

    private readonly dataSource: DataSource,
  ) { }

  // ─────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────

  private assertFound<T>(entity: T | null, label: string): T {
    if (!entity) throw new NotFoundException(`${label} não encontrado(a)`);
    return entity;
  }

  /**
   * Distribui o valor total em N parcelas, ajustando centavos na última
   * para evitar diferença de arredondamento.
   */
  private distribuirParcelas(
    valorTotal: number,
    n: number,
  ): number[] {
    const valorParcela = +(valorTotal / n).toFixed(2);
    const valores = Array(n).fill(valorParcela);
    // Ajuste de centavos na última parcela
    valores[n - 1] = +(valorTotal - valorParcela * (n - 1)).toFixed(2);
    return valores;
  }

  private calcularProximaData(dataBase: Date, tipo: TipoRecorrencia): Date {
    const base = new Date(dataBase);
    const map: Record<TipoRecorrencia, () => Date> = {
      [TipoRecorrencia.DIARIA]: () => addDays(base, 1),
      [TipoRecorrencia.SEMANAL]: () => addWeeks(base, 1),
      [TipoRecorrencia.MENSAL]: () => addMonths(base, 1),
      [TipoRecorrencia.BIMESTRAL]: () => addMonths(base, 2),
      [TipoRecorrencia.TRIMESTRAL]: () => addMonths(base, 3),
      [TipoRecorrencia.SEMESTRAL]: () => addMonths(base, 6),
      [TipoRecorrencia.ANUAL]: () => addMonths(base, 12),
    };
    return map[tipo]();
  }

  private async somarContas(
    where: FindOptionsWhere<ContaPagar>,
  ): Promise<number> {
    const result = await this.contaRepo
      .createQueryBuilder('c')
      .select('SUM(c.valor_total)', 'total')
      .where(where as any)
      .getRawOne();
    return parseFloat(result?.total ?? '0');
  }

  // ─────────────────────────────────────────────────────────────────
  // CRUD PRINCIPAL
  // ─────────────────────────────────────────────────────────────────

  /**
   * Cria uma conta a pagar.
   *
   * Quando `numero_parcelas > 1`, são criados N registros independentes
   * de ContaPagar (um por parcela), cada um com seu próprio vencimento
   * e valor proporcional. O primeiro registro é a "conta-pai" e os
   * demais recebem `conta_pai_id` apontando para ela.
   *
   * Isso garante que cada parcela apareça individualmente na listagem
   * e possa ser paga de forma independente.
   */
  async create(dto: CreateContasPagarDto): Promise<ContaPagar> {
    return this.dataSource.transaction(async (manager) => {
      const valorTotal = Number(dto.valor_total);
      const numParcelas = dto.numero_parcelas ?? 1;
      const dataBase = new Date(dto.data_vencimento);

      // ── Conta única (sem parcelamento) ────────────────────────────
      if (numParcelas === 1) {
        const id = uuid();
        const conta = manager.create(ContaPagar, {
          id,
          descricao: dto.descricao,
          numero_documento: dto.numero_documento,
          beneficiario: dto.beneficiario,
          observacoes: dto.observacoes,
          data_vencimento: new Date(dto.data_vencimento),
          data_competencia: dto.data_competencia ? new Date(dto.data_competencia) : undefined,
          categoria_id: dto.categoria_id,
          centro_custo: dto.centro_custo,
          conta_bancaria: dto.conta_bancaria,
          forma_pagamento: dto.forma_pagamento,
          recorrente: dto.recorrente,
          tipo_recorrencia: dto.tipo_recorrencia,
          recorrencia_fim: dto.recorrencia_fim ? new Date(dto.recorrencia_fim) : undefined,
          usuario_id: dto.usuario_id,
          valor_total: valorTotal,
          valor_pago: 0,
          valor_aberto: valorTotal,
          numero_parcelas: 1,
          parcela_atual: undefined,   // <-- undefined, não null
          conta_pai_id: undefined,   // <-- undefined, não null
          status: StatusContaPagar.PENDENTE,
        });
        await manager.save(conta);

        return this.assertFound(
          await manager.findOne(ContaPagar, {
            where: { id },
            relations: ['categoria'],
          }),
          `Conta #${id}`,
        );
      }

      // ── Conta parcelada — gera N ContaPagar independentes ─────────
      const valores = this.distribuirParcelas(valorTotal, numParcelas);
      const parentId = uuid();
      const contas: ContaPagar[] = [];

      for (let i = 0; i < numParcelas; i++) {
        const isPrimeira = i === 0;
        const id = isPrimeira ? parentId : uuid();
        const valorParcela = valores[i];
        const dataVenc = addMonths(dataBase, i);

        const conta = manager.create(ContaPagar, {
          id,
          descricao: dto.descricao,
          numero_documento: dto.numero_documento,
          beneficiario: dto.beneficiario,
          observacoes: dto.observacoes,
          categoria_id: dto.categoria_id,
          centro_custo: dto.centro_custo,
          conta_bancaria: dto.conta_bancaria,
          forma_pagamento: dto.forma_pagamento,
          recorrente: dto.recorrente,
          tipo_recorrencia: dto.tipo_recorrencia,
          recorrencia_fim: dto.recorrencia_fim ? new Date(dto.recorrencia_fim) : undefined,
          usuario_id: dto.usuario_id,
          valor_total: valorParcela,
          valor_pago: 0,
          valor_aberto: valorParcela,
          numero_parcelas: numParcelas,
          parcela_atual: i + 1,
          conta_pai_id: isPrimeira ? undefined : parentId,   // <-- undefined, não null
          data_vencimento: dataVenc,
          data_competencia: dto.data_competencia
            ? addMonths(new Date(dto.data_competencia), i)
            : dataVenc,
          status: StatusContaPagar.PENDENTE,
        });

        contas.push(conta);
      }

      await manager.save(contas);

      // Retorna a conta-pai (1ª parcela)
      return this.assertFound(
        await manager.findOne(ContaPagar, {
          where: { id: parentId },
          relations: ['categoria'],
        }),
        `Conta #${parentId}`,
      );
    });
  }

  async findAll(filter: FilterContasPagarDto) {
    // Garante que contas vencidas estejam com o status correto
    await this.atualizarVencidos();

    const {
      page = 1,
      limit = 20,
      order_by = 'data_vencimento',
      order_dir = 'ASC',
      ...filtros
    } = filter;

    const skip = (page - 1) * limit;
    const qb = this.contaRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.categoria', 'cat')
      .skip(skip)
      .take(limit)
      .orderBy(`c.${order_by}`, order_dir);

    if (filtros.status)
      qb.andWhere('c.status = :status', { status: filtros.status });
    if (filtros.categoria_id)
      qb.andWhere('c.categoria_id = :catId', { catId: filtros.categoria_id });
    if (filtros.centro_custo)
      qb.andWhere('c.centro_custo = :cc', { cc: filtros.centro_custo });
    if (filtros.forma_pagamento)
      qb.andWhere('c.forma_pagamento = :fp', { fp: filtros.forma_pagamento });
    if (filtros.apenas_recorrentes)
      qb.andWhere('c.recorrente = true');

    if (filtros.descricao)
      qb.andWhere('c.descricao LIKE :desc', { desc: `%${filtros.descricao}%` });
    if (filtros.beneficiario)
      qb.andWhere('c.beneficiario LIKE :ben', { ben: `%${filtros.beneficiario}%` });
    if (filtros.numero_documento)
      qb.andWhere('c.numero_documento LIKE :ndoc', { ndoc: `%${filtros.numero_documento}%` });

    if (filtros.vencimento_de)
      qb.andWhere('c.data_vencimento >= :vde', { vde: filtros.vencimento_de });
    if (filtros.vencimento_ate)
      qb.andWhere('c.data_vencimento <= :vate', { vate: filtros.vencimento_ate });

    if (filtros.competencia_de)
      qb.andWhere('c.data_competencia >= :cde', { cde: filtros.competencia_de });
    if (filtros.competencia_ate)
      qb.andWhere('c.data_competencia <= :cate', { cate: filtros.competencia_ate });

    if (filtros.valor_min !== undefined)
      qb.andWhere('c.valor_total >= :vmin', { vmin: filtros.valor_min });
    if (filtros.valor_max !== undefined)
      qb.andWhere('c.valor_total <= :vmax', { vmax: filtros.valor_max });

    if (filtros.apenas_vencidos) {
      qb.andWhere('c.data_vencimento < :hoje', { hoje: new Date() });
      qb.andWhere('c.status IN (:...pendentes)', {
        pendentes: [StatusContaPagar.PENDENTE, StatusContaPagar.PARCIAL],
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ContaPagar> {
    const conta = await this.contaRepo.findOne({
      where: { id },
      relations: ['categoria', 'parcelas', 'pagamentos'],
    });
    return this.assertFound(conta, `Conta a pagar #${id}`);
  }

  async update(id: string, dto: UpdateContasPagarDto): Promise<ContaPagar> {
    const conta = await this.findOne(id);

    if (conta.status === StatusContaPagar.PAGO) {
      throw new ConflictException('Não é possível alterar uma conta já quitada');
    }

    Object.assign(conta, dto);

    if (dto.valor_total !== undefined) {
      conta.valor_aberto = Number(dto.valor_total) - conta.valor_pago;
    }

    return this.contaRepo.save(conta);
  }

  async remove(id: string): Promise<{ message: string }> {
    const conta = await this.findOne(id);

    if (conta.status === StatusContaPagar.PAGO) {
      throw new ConflictException('Não é possível excluir uma conta já quitada');
    }

    await this.contaRepo.remove(conta);
    return { message: `Conta #${id} removida com sucesso` };
  }

  async cancelar(id: string): Promise<ContaPagar> {
    const conta = await this.findOne(id);

    if (conta.status === StatusContaPagar.PAGO) {
      throw new ConflictException('Não é possível cancelar uma conta já quitada');
    }

    conta.status = StatusContaPagar.CANCELADO;
    return this.contaRepo.save(conta);
  }

  // ─────────────────────────────────────────────────────────────────
  // PAGAMENTOS
  // ─────────────────────────────────────────────────────────────────

  async registrarPagamento(
    id: string,
    dto: RegistrarPagamentoDto,
  ): Promise<ContaPagar> {
    return this.dataSource.transaction(async (manager) => {
      const conta = this.assertFound(
        await manager.findOne(ContaPagar, {
          where: { id },
          relations: ['pagamentos', 'parcelas'],
        }),
        `Conta #${id}`,
      );

      if (conta.status === StatusContaPagar.PAGO) {
        throw new ConflictException('Esta conta já está quitada');
      }
      if (conta.status === StatusContaPagar.CANCELADO) {
        throw new ConflictException('Não é possível pagar uma conta cancelada');
      }

      const valorLiquido =
        Number(dto.valor) + (dto.valor_juros ?? 0) - (dto.valor_desconto ?? 0);

      if (valorLiquido > conta.valor_aberto + 0.01) {
        throw new BadRequestException(
          `Valor do pagamento (R$ ${valorLiquido.toFixed(2)}) excede o saldo em aberto (R$ ${conta.valor_aberto.toFixed(2)})`,
        );
      }

      // Persiste o registro de pagamento
      const pagamento = manager.create(ContaPagarPagamento, {
        id: uuid(),
        conta,
        valor: Number(dto.valor),
        valor_desconto: dto.valor_desconto ?? 0,
        valor_juros: dto.valor_juros ?? 0,
        data_pagamento: new Date(dto.data_pagamento),
        forma_pagamento: dto.forma_pagamento,
        conta_bancaria: dto.conta_bancaria,
        comprovante_url: dto.comprovante_url,
        observacoes: dto.observacoes,
        usuario_id: dto.usuario_id,
      });

      await manager.save(pagamento);

      // Atualiza totais na conta
      conta.valor_pago = +(conta.valor_pago + valorLiquido).toFixed(2);
      conta.valor_aberto = +(conta.valor_total - conta.valor_pago).toFixed(2);
      conta.forma_pagamento = dto.forma_pagamento;

      if (dto.valor_juros)
        conta.valor_juros = +((conta.valor_juros ?? 0) + dto.valor_juros).toFixed(2);
      if (dto.valor_desconto)
        conta.valor_desconto = +((conta.valor_desconto ?? 0) + dto.valor_desconto).toFixed(2);

      // Determina novo status
      if (conta.valor_aberto <= 0.01) {
        conta.status = StatusContaPagar.PAGO;
        conta.data_pagamento = new Date(dto.data_pagamento);
      } else {
        conta.status = StatusContaPagar.PARCIAL;
      }

      if (conta.pagamentos) conta.pagamentos.push(pagamento);

      await manager.save(conta);

      return this.assertFound(
        await manager.findOne(ContaPagar, {
          where: { id },
          relations: ['pagamentos', 'parcelas'],
        }),
        `Conta #${id}`,
      );
    });
  }

  async estornarPagamento(
    contaId: string,
    pagamentoId: string,
  ): Promise<ContaPagar> {
    return this.dataSource.transaction(async (manager) => {
      const pagamento = this.assertFound(
        await manager.findOne(ContaPagarPagamento, {
          where: { id: pagamentoId, conta_id: contaId },
        }),
        `Pagamento #${pagamentoId}`,
      );

      const conta = this.assertFound(
        await manager.findOne(ContaPagar, { where: { id: contaId } }),
        `Conta #${contaId}`,
      );

      const valorEstorno =
        pagamento.valor + pagamento.valor_juros - pagamento.valor_desconto;

      conta.valor_pago = +(conta.valor_pago - valorEstorno).toFixed(2);
      conta.valor_aberto = +(conta.valor_total - conta.valor_pago).toFixed(2);
      conta.status =
        conta.valor_pago > 0
          ? StatusContaPagar.PARCIAL
          : StatusContaPagar.PENDENTE;

      await manager.remove(pagamento);
      await manager.save(conta);

      return this.assertFound(
        await manager.findOne(ContaPagar, {
          where: { id: contaId },
          relations: ['pagamentos'],
        }),
        `Conta #${contaId}`,
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // RECORRÊNCIA
  // ─────────────────────────────────────────────────────────────────

  async gerarProximaRecorrencia(id: string): Promise<ContaPagar> {
    const contaPai = await this.findOne(id);

    if (!contaPai.recorrente) {
      throw new BadRequestException('Esta conta não é recorrente');
    }
    if (!contaPai.tipo_recorrencia) {
      throw new BadRequestException('Tipo de recorrência não definido');
    }

    const novaData = this.calcularProximaData(
      contaPai.data_vencimento,
      contaPai.tipo_recorrencia,
    );

    if (
      contaPai.recorrencia_fim &&
      isAfter(novaData, new Date(contaPai.recorrencia_fim))
    ) {
      throw new ConflictException('Recorrência encerrada — data fim atingida');
    }

    const novaDto: CreateContasPagarDto = {
      descricao: contaPai.descricao,
      beneficiario: contaPai.beneficiario,
      valor_total: contaPai.valor_total,
      data_vencimento: novaData.toISOString().split('T')[0],
      data_competencia: novaData.toISOString().split('T')[0],
      categoria_id: contaPai.categoria_id,
      centro_custo: contaPai.centro_custo,
      conta_bancaria: contaPai.conta_bancaria,
      forma_pagamento: contaPai.forma_pagamento,
      recorrente: true,
      tipo_recorrencia: contaPai.tipo_recorrencia,
      recorrencia_fim: contaPai.recorrencia_fim?.toISOString().split('T')[0],
    };

    const nova = await this.create(novaDto);
    await this.contaRepo.update(nova.id, { conta_pai_id: id });

    return this.findOne(nova.id);
  }

  // ─────────────────────────────────────────────────────────────────
  // ATUALIZAÇÃO AUTOMÁTICA DE STATUS VENCIDOS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Marca como VENCIDO todas as contas com data_vencimento anterior a hoje
   * que ainda estão como PENDENTE ou PARCIAL.
   *
   * Chamado automaticamente antes de qualquer consulta de listagem/dashboard
   * para garantir que os dados reflitam a realidade sem depender de cron job.
   */
  async atualizarVencidos(): Promise<{ atualizadas: number }> {
    const resultado = await this.contaRepo
      .createQueryBuilder()
      .update(ContaPagar)
      .set({ status: StatusContaPagar.VENCIDO })
      .where('data_vencimento < :hoje', { hoje: startOfDay(new Date()) })
      .andWhere('status IN (:...status)', {
        status: [StatusContaPagar.PENDENTE, StatusContaPagar.PARCIAL],
      })
      .execute();

    return { atualizadas: resultado.affected ?? 0 };
  }

  // ─────────────────────────────────────────────────────────────────
  // DASHBOARD / RELATÓRIOS
  // ─────────────────────────────────────────────────────────────────

  async getDashboard(mes?: string, ano?: string) {
    // Sempre atualiza status vencidos antes de montar o dashboard,
    // garantindo que os totais reflitam o estado real das contas.
    await this.atualizarVencidos();

    const hoje = new Date();
    const anoRef = ano ? parseInt(ano) : hoje.getFullYear();
    const mesRef = mes ? parseInt(mes) : hoje.getMonth() + 1;

    const inicioPeriodo = new Date(anoRef, mesRef - 1, 1);
    const fimPeriodo = new Date(anoRef, mesRef, 0, 23, 59, 59);

    const [
      totalGeral,
      totalPago,
      totalPendente,
      totalVencido,
      totalCancelado,
    ] = await Promise.all([
      this.somarContas({ status: Not(StatusContaPagar.CANCELADO) as any }),
      this.somarContas({ status: StatusContaPagar.PAGO }),
      this.somarContas({ status: StatusContaPagar.PENDENTE }),
      this.somarContas({ status: StatusContaPagar.VENCIDO }),
      this.somarContas({ status: StatusContaPagar.CANCELADO }),
    ]);

    // Totais do mês corrente por status
    const totaisMes = await this.contaRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('SUM(c.valor_total)', 'total')
      .addSelect('COUNT(c.id)', 'quantidade')
      .where('c.data_vencimento BETWEEN :ini AND :fim', {
        ini: inicioPeriodo,
        fim: fimPeriodo,
      })
      .andWhere('c.status != :cancelado', {
        cancelado: StatusContaPagar.CANCELADO,
      })
      .groupBy('c.status')
      .getRawMany();

    // Totais por categoria (mês corrente)
    const porCategoria = await this.contaRepo
      .createQueryBuilder('c')
      .leftJoin('c.categoria', 'cat')
      .select('cat.nome', 'categoria')
      .addSelect('cat.cor', 'cor')
      .addSelect('SUM(c.valor_total)', 'total')
      .addSelect('SUM(c.valor_pago)', 'pago')
      .addSelect('COUNT(c.id)', 'quantidade')
      .where('c.data_vencimento BETWEEN :ini AND :fim', {
        ini: inicioPeriodo,
        fim: fimPeriodo,
      })
      .andWhere('c.status != :cancelado', {
        cancelado: StatusContaPagar.CANCELADO,
      })
      .groupBy('cat.id')
      .orderBy('total', 'DESC')
      .getRawMany();

    // Fluxo mensal — últimos 12 meses
    const fluxoMensal = await this.contaRepo
      .createQueryBuilder('c')
      .select("TO_CHAR(c.data_vencimento, 'YYYY-MM')", 'mes')
      .addSelect('SUM(c.valor_total)', 'total_previsto')
      .addSelect('SUM(c.valor_pago)', 'total_pago')
      .addSelect(
        "SUM(CASE WHEN c.status = 'PAGO' THEN c.valor_total ELSE 0 END)",
        'total_quitado',
      )
      .where("c.data_vencimento >= NOW() - INTERVAL '12 months'")
      .andWhere('c.status != :cancelado', {
        cancelado: StatusContaPagar.CANCELADO,
      })
      .groupBy("TO_CHAR(c.data_vencimento, 'YYYY-MM')")
      .orderBy('mes', 'ASC')
      .getRawMany();

    // Alertas: próximos a vencer nos próximos 7 dias
    const proximosVencer = await this.contaRepo.find({
      where: {
        data_vencimento: Between(hoje, addDays(hoje, 7)),
        status: StatusContaPagar.PENDENTE,
      },
      relations: ['categoria'],
      order: { data_vencimento: 'ASC' },
    });

    // Alertas: vencidos em aberto
    const vencidosEmAberto = await this.contaRepo.find({
      where: { status: StatusContaPagar.VENCIDO },
      relations: ['categoria'],
      order: { data_vencimento: 'ASC' },
    });

    return {
      resumo: {
        total_geral: totalGeral,
        total_pago: totalPago,
        total_pendente: totalPendente,
        total_vencido: totalVencido,
        total_cancelado: totalCancelado,
        taxa_inadimplencia:
          totalGeral > 0
            ? +((totalVencido / totalGeral) * 100).toFixed(2)
            : 0,
      },
      mes_atual: {
        referencia: `${String(mesRef).padStart(2, '0')}/${anoRef}`,
        por_status: totaisMes.map((r) => ({
          status: r.status,
          total: parseFloat(r.total ?? '0'),
          quantidade: parseInt(r.quantidade),
        })),
      },
      por_categoria: porCategoria.map((r) => ({
        categoria: r.categoria ?? 'Sem categoria',
        cor: r.cor ?? null,
        total: parseFloat(r.total ?? '0'),
        pago: parseFloat(r.pago ?? '0'),
        pendente: parseFloat(r.total ?? '0') - parseFloat(r.pago ?? '0'),
        quantidade: parseInt(r.quantidade),
      })),
      fluxo_mensal: fluxoMensal.map((r) => ({
        mes: r.mes,
        total_previsto: parseFloat(r.total_previsto ?? '0'),
        total_pago: parseFloat(r.total_pago ?? '0'),
        total_quitado: parseFloat(r.total_quitado ?? '0'),
      })),
      alertas: {
        proximos_vencer: proximosVencer,
        vencidos_em_aberto: vencidosEmAberto,
        total_em_atraso: +vencidosEmAberto
          .reduce((acc, c) => acc + c.valor_aberto, 0)
          .toFixed(2),
      },
    };
  }

  async getRelatorioPorPeriodo(de: string, ate: string) {
    const contas = await this.contaRepo.find({
      where: { data_vencimento: Between(new Date(de), new Date(ate)) },
      relations: ['categoria'],
      order: { data_vencimento: 'ASC' },
    });

    const total = contas.reduce((acc, c) => acc + c.valor_total, 0);
    const pago = contas.reduce((acc, c) => acc + c.valor_pago, 0);
    const aberto = contas.reduce((acc, c) => acc + c.valor_aberto, 0);

    return {
      periodo: { de, ate },
      contas,
      totais: {
        total: +total.toFixed(2),
        pago: +pago.toFixed(2),
        aberto: +aberto.toFixed(2),
        quantidade: contas.length,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // CATEGORIAS
  // ─────────────────────────────────────────────────────────────────

  async findAllCategorias(): Promise<CategoriaDespesa[]> {
    return this.categoriaRepo.find({
      where: { ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async createCategoria(
    dto: Partial<CategoriaDespesa>,
  ): Promise<CategoriaDespesa> {
    const cat = this.categoriaRepo.create({ id: uuid(), ...dto });
    return this.categoriaRepo.save(cat);
  }
}