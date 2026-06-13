/**
 * @file comissoes.service.ts
 * @description Serviço responsável pelo ciclo de vida das comissões de vendedores.
 *
 * CICLO DE STATUS DE UMA COMISSÃO:
 *   PREVISTA → LIBERADA → PAGA
 *       ↓          ↓
 *   CANCELADA  CANCELADA
 *
 * REGRAS DE NEGÓCIO:
 *   - PREVISTA: gerada quando a venda é aprovada; aguarda recebimento do cliente
 *   - LIBERADA: ocorre quando todas as parcelas da venda são recebidas
 *   - PAGA: comissão efetivamente paga ao vendedor (registro de saída)
 *   - CANCELADA: venda foi cancelada antes do pagamento da comissão
 *
 * CÁLCULO DA COMISSÃO:
 *   1. Percentual base definido no cadastro do vendedor (padrão: 5%)
 *   2. Desconto > 10% na venda reduz comissão em 0,5% (mínimo 2,5%)
 *   3. Teto máximo de R$ 5.000,00 por venda (tipo muda para TABELADA)
 *
 * TRANSAÇÕES:
 *   Todos os métodos aceitam EntityManager opcional para participar de transações
 *   iniciadas em outros services (ex: VendasService, ContasReceberService).
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, EntityManager } from 'typeorm';
import {
  Comissao,
  StatusComissao,
  TipoCalculoComissao,
} from './entities/comissoe.entity';
import {
  CreateComissaoDto,
  LiberarComissaoDto,
  PagarComissaoDto,
  FiltrarComissoesDto,
} from './dto/create-comissoe.dto';
import { UpdateComissaoDto } from './dto/update-comissoe.dto';
import { Venda } from '../vendas/entities/venda.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { ContaReceber, StatusContaReceber } from '../contas_receber/entities/contas_receber.entity';

@Injectable()
export class ComissoesService {
  private readonly logger = new Logger(ComissoesService.name);

  constructor(
    @InjectRepository(Comissao)
    private readonly comissaoRepository: Repository<Comissao>,
    @InjectRepository(Venda)
    private readonly vendaRepository: Repository<Venda>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(ContaReceber)
    private readonly contaReceberRepository: Repository<ContaReceber>,
    private readonly dataSource: DataSource,
  ) { }

  // ---------------------------------------------------------------------------
  // HELPER PRIVADO
  // ---------------------------------------------------------------------------

  /**
   * Retorna os repositórios corretos conforme esteja dentro ou fora de uma transação.
   * Centraliza a lógica de "manager ou repositório próprio".
   */
  private repos(manager?: EntityManager) {
    return {
      comissaoRepo: manager
        ? manager.getRepository(Comissao)
        : this.comissaoRepository,
      vendaRepo: manager
        ? manager.getRepository(Venda)
        : this.vendaRepository,
      usuarioRepo: manager
        ? manager.getRepository(Usuario)
        : this.usuarioRepository,
      contaRepo: manager
        ? manager.getRepository(ContaReceber)
        : this.contaReceberRepository,
    };
  }

  // ===========================================================================
  // GERAÇÃO DE COMISSÃO (chamado pelo VendasService)
  // ===========================================================================

  /**
   * Gera a comissão para uma venda recém-aprovada.
   *
   * Retorna `null` (sem lançar exceção) nos seguintes casos aceitáveis:
   *   - Venda não tem vendedor associado
   *   - Vendedor não encontrado no banco
   *
   * @param vendaId ID da venda aprovada
   * @param manager EntityManager da transação (recomendado para garantir atomicidade)
   * @returns Comissão criada, ou null se não aplicável
   *
   * @throws BadRequestException se já existir comissão para esta venda
   * @throws NotFoundException se a venda não for encontrada
   */
  async gerarComissoesDaVenda(
    vendaId: string,
    manager?: EntityManager,
  ): Promise<Comissao | null> {
    this.logger.log(`Gerando comissão para venda ${vendaId}`);
    const { comissaoRepo, vendaRepo, usuarioRepo } = this.repos(manager);

    // Busca a venda com vendedor e itens
    const venda = await vendaRepo.findOne({
      where: { id: vendaId },
      relations: ['vendedor', 'itens'],
    });

    if (!venda) {
      throw new NotFoundException(`Venda ${vendaId} não encontrada`);
    }

    // Verifica duplicata
    const existente = await comissaoRepo.findOne({ where: { vendaId } });
    if (existente) {
      throw new BadRequestException(
        `Comissão já foi gerada para a venda ${vendaId}`,
      );
    }

    // Sem vendedor: não gera comissão (comportamento aceitável)
    if (!venda.vendedorId) {
      this.logger.warn(
        `Venda ${vendaId} sem vendedor — comissão não gerada`,
      );
      return null;
    }

    const vendedor = await usuarioRepo.findOne({
      where: { id: venda.vendedorId },
    });

    if (!vendedor) {
      this.logger.warn(
        `Vendedor ${venda.vendedorId} não encontrado — comissão não gerada`,
      );
      return null;
    }

    // Calcula o valor da comissão com as regras de negócio
    const { percentual, tipoCalculo, valorComissao } =
      this.calcularComissao(venda, vendedor);

    const comissao = comissaoRepo.create({
      vendedorId: venda.vendedorId,
      vendaId: venda.id,
      tipoCalculo,
      baseCalculo: venda.valorTotal,
      percentualAplicado: percentual,
      valorComissao,
      status: StatusComissao.PREVISTA,
    });

    const saved = await comissaoRepo.save(comissao);
    this.logger.log(
      `Comissão gerada — ID: ${saved.id} | Vendedor: ${vendedor.nome} | Valor: R$ ${valorComissao.toFixed(2)} (${percentual}%)`,
    );

    return saved;
  }

  // ===========================================================================
  // LIBERAÇÃO DE COMISSÃO (chamado pelo ContasReceberService)
  // ===========================================================================

  /**
   * Libera a comissão de uma venda quando o recebimento é concluído.
   *
   * A comissão só é liberada quando TODAS as parcelas da venda estiverem pagas.
   * Para vendas com parcela única (caso mais comum na madeireira), a comissão
   * é liberada imediatamente após o recebimento.
   *
   * @param contaReceberId ID da conta a receber recém-paga
   * @param manager        EntityManager da transação (recomendado)
   * @returns Comissão liberada, ou null se outras parcelas ainda pendentes
   */
  async liberarComissoesPorRecebimento(
    contaReceberId: string,
    manager?: EntityManager,
  ): Promise<Comissao | null> {
    this.logger.log(
      `Verificando liberação de comissão para conta ${contaReceberId}`,
    );
    const { comissaoRepo, contaRepo } = this.repos(manager);

    const contaReceber = await contaRepo.findOne({
      where: { id: contaReceberId },
    });

    if (!contaReceber) {
      throw new NotFoundException('Conta a receber não encontrada');
    }

    // Busca comissão PREVISTA vinculada à venda
    const comissao = await comissaoRepo.findOne({
      where: {
        vendaId: contaReceber.vendaId,
        status: StatusComissao.PREVISTA,
      },
    });

    if (!comissao) {
      this.logger.log(
        `Nenhuma comissão PREVISTA para venda ${contaReceber.vendaId}`,
      );
      return null;
    }

    // Verifica se TODAS as parcelas da venda foram pagas
    const contasDaVenda = await contaRepo.find({
      where: { vendaId: contaReceber.vendaId },
    });

    const todasPagas = contasDaVenda.every(
      (c) => c.status === StatusContaReceber.PAGO,
    );

    if (!todasPagas) {
      const pendentes = contasDaVenda.filter(
        (c) => c.status !== StatusContaReceber.PAGO,
      ).length;
      this.logger.log(
        `Comissão aguardando ${pendentes} parcela(s) restante(s)`,
      );
      return null;
    }

    // Libera a comissão
    comissao.status = StatusComissao.LIBERADA;
    comissao.dataLiberacao = new Date();
    comissao.contaReceberId = contaReceberId;

    const liberada = await comissaoRepo.save(comissao);
    this.logger.log(
      `Comissão ${comissao.id} liberada — Valor: R$ ${comissao.valorComissao}`,
    );

    return liberada;
  }

  // ===========================================================================
  // PAGAMENTO DE COMISSÕES
  // ===========================================================================

  /**
   * Marca comissões como pagas ao vendedor.
   * Apenas comissões com status LIBERADA podem ser pagas.
   *
   * @param dto       IDs das comissões e observações do pagamento
   * @param usuarioId ID do usuário que está registrando o pagamento
   * @param manager   EntityManager da transação (opcional)
   *
   * @throws BadRequestException se alguma comissão não estiver liberada
   */
  async pagarComissoes(
    dto: PagarComissaoDto,
    usuarioId: string,
    manager?: EntityManager,
  ): Promise<Comissao[]> {
    this.logger.log(
      `Registrando pagamento de ${dto.comissoesIds.length} comissão(ões)`,
    );
    const { comissaoRepo } = this.repos(manager);

    const comissoes = await comissaoRepo.find({
      where: {
        id: In(dto.comissoesIds),
        status: StatusComissao.LIBERADA,
      },
    });

    if (comissoes.length !== dto.comissoesIds.length) {
      const idsEncontrados = comissoes.map((c) => c.id);
      const naoEncontrados = dto.comissoesIds.filter(
        (id) => !idsEncontrados.includes(id),
      );
      throw new BadRequestException(
        `As seguintes comissões não estão disponíveis para pagamento (devem estar LIBERADAS): ${naoEncontrados.join(', ')}`,
      );
    }

    const dataPagamento = new Date();
    const pagas: Comissao[] = [];

    for (const comissao of comissoes) {
      comissao.status = StatusComissao.PAGA;
      comissao.dataPagamento = dataPagamento;
      comissao.pagoPorId = usuarioId;
      comissao.observacoes = dto.observacoes ?? comissao.observacoes;

      pagas.push(await comissaoRepo.save(comissao));
    }

    const valorTotal = comissoes.reduce(
      (sum, c) => sum + Number(c.valorComissao),
      0,
    );

    this.logger.log(
      `${pagas.length} comissão(ões) pagas — Total: R$ ${valorTotal.toFixed(2)}`,
    );

    return pagas;
  }

  // ===========================================================================
  // CANCELAMENTO DE COMISSÃO (chamado pelo VendasService)
  // ===========================================================================

  /**
   * Cancela as comissões de uma venda quando ela é cancelada.
   *
   * Regras:
   *   - Comissão PREVISTA ou LIBERADA → CANCELADA
   *   - Comissão PAGA → lança exceção (precisa estornar o pagamento antes)
   *
   * @param vendaId ID da venda cancelada
   * @param motivo  Motivo do cancelamento
   * @param manager EntityManager da transação (recomendado)
   *
   * @throws BadRequestException se a comissão já estiver paga
   */
  async cancelarComissoesDaVenda(
    vendaId: string,
    motivo: string,
    manager?: EntityManager,
  ): Promise<Comissao | null> {
    this.logger.log(`Cancelando comissões da venda ${vendaId}`);
    const { comissaoRepo } = this.repos(manager);

    const comissao = await comissaoRepo.findOne({ where: { vendaId } });

    if (!comissao) {
      this.logger.log(
        `Nenhuma comissão encontrada para venda ${vendaId} — nada a cancelar`,
      );
      return null;
    }

    //    if (comissao.status === StatusComissao.PAGA) {
    //    throw new BadRequestException(
    //    'Não é possível cancelar uma venda com comissão já paga. ' +
    //    'Estorne o pagamento da comissão antes de cancelar a venda.',
    //);
    //}

    const statusAnterior = comissao.status;
    comissao.status = StatusComissao.CANCELADA;
    comissao.observacoes = `Cancelada: ${motivo}`;

    const cancelada = await comissaoRepo.save(comissao);
    this.logger.log(
      `Comissão ${comissao.id} cancelada (era: ${statusAnterior}) — Motivo: ${motivo}`,
    );

    return cancelada;
  }

  // ===========================================================================
  // CONSULTAS
  // ===========================================================================

  /**
   * Busca comissões com filtros dinâmicos.
   * O filtro de data usa a data de criação da VENDA (não da comissão),
   * garantindo que comissões de vendas do período apareçam corretamente.
   */
  async buscarComissoes(filtro: FiltrarComissoesDto): Promise<Comissao[]> {
    const query = this.comissaoRepository
      .createQueryBuilder('comissao')
      .leftJoinAndSelect('comissao.vendedor', 'vendedor')
      .leftJoinAndSelect('comissao.venda', 'venda')
      .leftJoinAndSelect('venda.cliente', 'cliente');

    // Forçar a ordenação no final para não bugar o builder
    query.orderBy('comissao.createdAt', 'DESC');

    if (filtro.vendedorId) {
      query.andWhere('comissao.vendedorId = :vendedorId', {
        vendedorId: filtro.vendedorId,
      });
    }

    // CORREÇÃO AQUI: Certifique-se de que o filtro.status existe e não é uma string vazia
    if (filtro.status && filtro.status.trim() !== '') {
      query.andWhere('comissao.status = :status', { status: filtro.status });
    }

    if (filtro.vendaId) {
      query.andWhere('comissao.vendaId = :vendaId', {
        vendaId: filtro.vendaId,
      });
    }

    if (filtro.status) {
      // Se o usuário pediu um status específico (ex: PREVISTA), filtramos só ele
      query.andWhere('comissao.status = :status', { status: filtro.status });
    } else {
      // Se NÃO enviou status, trazemos todos MENOS as canceladas
      query.andWhere('comissao.status != :statusCancelada', {
        statusCancelada: StatusComissao.CANCELADA
      });
    }

    // Filtra pela data da VENDA para incluir comissões geradas depois (ex: PREVISTAS)
    if (filtro.dataInicio && filtro.dataFim) {
      const dataInicio =
        filtro.dataInicio instanceof Date
          ? filtro.dataInicio.toISOString().split('T')[0]
          : filtro.dataInicio;
      const dataFim =
        filtro.dataFim instanceof Date
          ? filtro.dataFim.toISOString().split('T')[0]
          : filtro.dataFim;

      query.andWhere(
        'DATE(venda.created_at) BETWEEN :dataInicio AND :dataFim',
        { dataInicio, dataFim },
      );
    }

    return query.getMany();
  }

  /**
   * Gera relatório consolidado de comissões por período.
   * Agrupa totais por status e por vendedor.
   */
  async gerarRelatorioComissoes(
    dataInicio: Date,
    dataFim: Date,
  ): Promise<any> {
    this.logger.log(
      `Gerando relatório de comissões: ${dataInicio.toISOString().split('T')[0]} a ${dataFim.toISOString().split('T')[0]}`,
    );

    const comissoes = await this.comissaoRepository
      .createQueryBuilder('comissao')
      .leftJoinAndSelect('comissao.vendedor', 'vendedor')
      .leftJoinAndSelect('comissao.venda', 'venda')
      .where('comissao.createdAt BETWEEN :dataInicio AND :dataFim', {
        dataInicio,
        dataFim,
      })
      .getMany();

    const totais = { previsto: 0, liberado: 0, pago: 0, cancelado: 0 };
    const porVendedor: Record<
      string,
      { previsto: number; liberado: number; pago: number; cancelado: number; total: number }
    > = {};

    for (const comissao of comissoes) {
      const valor = Number(comissao.valorComissao);

      switch (comissao.status) {
        case StatusComissao.PREVISTA:
          totais.previsto += valor;
          break;
        case StatusComissao.LIBERADA:
          totais.liberado += valor;
          break;
        case StatusComissao.PAGA:
          totais.pago += valor;
          break;
        case StatusComissao.CANCELADA:
          totais.cancelado += valor;
          break;
      }

      if (comissao.vendedor) {
        const nome = comissao.vendedor.nome;
        if (!porVendedor[nome]) {
          porVendedor[nome] = {
            previsto: 0,
            liberado: 0,
            pago: 0,
            cancelado: 0,
            total: 0,
          };
        }
        const chaveStatus = comissao.status.toLowerCase() as keyof typeof porVendedor[string];
        if (chaveStatus in porVendedor[nome]) {
          porVendedor[nome][chaveStatus] += valor;
        }
        porVendedor[nome].total += valor;
      }
    }

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      totais,
      porVendedor,
      comissoes,
    };
  }

  /**
   * Dados para o dashboard de comissões.
   * Retorna totais por status e todas as comissões do período.
   *
   * @param dataInicio Início do período (padrão: 30 dias atrás)
   * @param dataFim    Fim do período (padrão: hoje)
   */
  async getDashboardData(dataInicio?: Date, dataFim?: Date): Promise<any> {
    const fim = dataFim ?? new Date();
    const inicio = dataInicio ?? (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d;
    })();

    const comissoes = await this.buscarComissoes({ dataInicio: inicio, dataFim: fim });

    const totalPrevisto = comissoes
      .filter((c) => c.status === StatusComissao.PREVISTA)
      .reduce((s, c) => s + Number(c.valorComissao), 0);

    const totalLiberado = comissoes
      .filter((c) => c.status === StatusComissao.LIBERADA)
      .reduce((s, c) => s + Number(c.valorComissao), 0);

    const totalPago = comissoes
      .filter((c) => c.status === StatusComissao.PAGA)
      .reduce((s, c) => s + Number(c.valorComissao), 0);

    const totalVendas = comissoes.reduce(
      (s, c) => s + (c.venda ? Number(c.venda.valorTotal) : 0),
      0,
    );

    return {
      periodo: { inicio, fim },
      totais: {
        previsto: totalPrevisto,
        liberado: totalLiberado,
        pago: totalPago,
        totalGeral: totalPrevisto + totalLiberado + totalPago,
        totalVendas,
      },
      ultimasComissoes: comissoes,
    };
  }

  // ===========================================================================
  // CRUD BÁSICO
  // ===========================================================================

  /** Cria uma comissão manual (use apenas para casos excepcionais) */
  async create(dto: CreateComissaoDto): Promise<Comissao> {
    this.logger.log('Criando comissão manual');
    const comissao = this.comissaoRepository.create(dto);
    return this.comissaoRepository.save(comissao);
  }

  /** Lista todas as comissões com relacionamentos */
  async findAll(): Promise<Comissao[]> {
    return this.comissaoRepository.find({
      relations: ['vendedor', 'venda', 'venda.cliente'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Busca uma comissão pelo ID com todos os relacionamentos */
  async findOne(id: string): Promise<Comissao> {
    const comissao = await this.comissaoRepository.findOne({
      where: { id },
      relations: ['vendedor', 'venda', 'venda.cliente', 'venda.vendedor'],
    });

    if (!comissao) {
      throw new NotFoundException(`Comissão ${id} não encontrada`);
    }

    return comissao;
  }

  /** Atualiza dados de uma comissão. Não permitido se já estiver paga. */
  async update(id: string, dto: UpdateComissaoDto): Promise<Comissao> {
    const comissao = await this.findOne(id);

    if (comissao.status === StatusComissao.PAGA) {
      throw new BadRequestException(
        'Não é possível alterar uma comissão já paga',
      );
    }

    this.comissaoRepository.merge(comissao, dto);
    return this.comissaoRepository.save(comissao);
  }

  /** Remove uma comissão. Apenas PREVISTA ou CANCELADA podem ser excluídas. */
  async remove(id: string): Promise<void> {
    const comissao = await this.findOne(id);

    if (
      ![StatusComissao.PREVISTA, StatusComissao.CANCELADA].includes(
        comissao.status,
      )
    ) {
      throw new BadRequestException(
        'Apenas comissões previstas ou canceladas podem ser excluídas',
      );
    }

    await this.comissaoRepository.remove(comissao);
    this.logger.log(`Comissão ${id} removida`);
  }

  // ===========================================================================
  // CÁLCULO DE COMISSÃO (privado)
  // ===========================================================================

  /**
   * Calcula o valor da comissão aplicando as regras de negócio:
   *   1. Base: percentual configurado no cadastro do vendedor (padrão 5%)
   *   2. Desconto > 10% na venda reduz 0,5% na comissão (mínimo 2,5%)
   *   3. Valor máximo de R$ 5.000,00 (tipo muda para TABELADA se atingir)
   *
   * @param venda    Venda com itens e valores calculados
   * @param vendedor Vendedor com percentual configurado
   */
  private calcularComissao(
    venda: Venda,
    vendedor: Usuario,
  ): {
    percentual: number;
    tipoCalculo: TipoCalculoComissao;
    valorComissao: number;
  } {
    let percentual = Number(vendedor.comissaoPercentual) || 5;
    let tipoCalculo = TipoCalculoComissao.PERCENTUAL_VENDA;

    // Regra 1: Desconto alto penaliza comissão
    if (venda.valorProdutos > 0 && venda.valorDesconto > 0) {
      const percentualDesconto =
        (Number(venda.valorDesconto) / Number(venda.valorProdutos)) * 100;

      if (percentualDesconto > 10) {
        const percentualAnterior = percentual;
        percentual = Math.max(percentual - 0.5, 2.5);
        this.logger.log(
          `Desconto de ${percentualDesconto.toFixed(1)}% — comissão reduzida de ${percentualAnterior}% para ${percentual}%`,
        );
      }
    }

    // Regra 2: Teto máximo
    const TETO_MAXIMO = 5000;
    const valorBruto = Number(venda.valorTotal) * (percentual / 100);
    const valorComissao = Math.min(valorBruto, TETO_MAXIMO);

    if (valorBruto > TETO_MAXIMO) {
      tipoCalculo = TipoCalculoComissao.TABELADA;
      this.logger.log(
        `Comissão atingiu teto de R$ ${TETO_MAXIMO} (bruto seria R$ ${valorBruto.toFixed(2)})`,
      );
    }

    return { percentual, tipoCalculo, valorComissao };
  }
}
