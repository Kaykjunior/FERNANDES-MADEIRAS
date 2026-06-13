/**
 * @file vendas.service.ts
 * @description Serviço principal de vendas da Madeireira.
 *
 * FLUXO DE STATUS DE UMA VENDA:
 *   ORÇAMENTO → APROVADO → EM_SEPARACAO → ENVIADO → ENTREGUE
 *                    ↓            ↓           ↓          ↓
 *                CANCELADO   CANCELADO   CANCELADO  CANCELADO
 *
 * REGRAS DE NEGÓCIO:
 *   - Ao criar: estoque é RESERVADO (não decrementado)
 *   - Ao aprovar: estoque é CONFIRMADO (reserva vira saída real), financeiro e
 *     comissões são gerados — tudo dentro de uma única transação
 *   - Ao cancelar ORÇAMENTO: apenas a reserva é cancelada
 *   - Ao cancelar APROVADO: estoque é devolvido, contas/comissões são canceladas
 *
 * TRANSAÇÕES:
 *   Toda operação que toca múltiplas tabelas usa QueryRunner para garantir
 *   atomicidade. Se qualquer etapa falhar, o banco inteiro faz rollback.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  EntityManager,
} from 'typeorm';
import { EstoqueService, ItemEstoque } from 'src/estoque/estoque.service';
import { EnderecosService } from 'src/enderecos/enderecos.service';
import { ComissoesService } from 'src/comissoes/comissoes.service';

import { Venda, StatusPagamento, StatusSefaz, StatusVenda } from './entities/venda.entity';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';
import { FaturarVendaDto } from './dto/faturar-venda.dto';
import { VendaItem } from 'src/venda_itens/entities/venda_iten.entity';
import { ContaReceber, StatusContaReceber } from 'src/contas_receber/entities/contas_receber.entity';
import { Comissao } from 'src/comissoes/entities/comissoe.entity';
import { Caixa } from 'src/caixa/entities/caixa.entity';
import { FormasPagamento } from 'src/formas_pagamento/entities/formas_pagamento.entity';
import { MovimentacaoEstoque, TipoMovimentacao } from 'src/movimentacoes_estoque/entities/movimentacoes_estoque.entity';
import { Produto } from 'src/produtos/entities/produto.entity';
import { Endereco } from 'src/enderecos/entities/endereco.entity';

@Injectable()
export class VendasService {
  private readonly logger = new Logger(VendasService.name);

  constructor(
    @InjectRepository(Venda)
    private readonly vendaRepository: Repository<Venda>,
    @InjectRepository(VendaItem)
    private readonly vendaItemRepository: Repository<VendaItem>,
    @InjectRepository(ContaReceber)
    private readonly contaReceberRepository: Repository<ContaReceber>,
    @InjectRepository(Comissao)
    private readonly comissaoRepository: Repository<Comissao>,
    @InjectRepository(Caixa)
    private readonly caixaRepository: Repository<Caixa>,
    @InjectRepository(FormasPagamento)
    private readonly formaPagamentoRepository: Repository<FormasPagamento>,
    @InjectRepository(MovimentacaoEstoque)
    private readonly movimentacaoEstoqueRepository: Repository<MovimentacaoEstoque>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,

    private readonly estoqueService: EstoqueService,
    private readonly enderecosService: EnderecosService,
    private readonly comissoesService: ComissoesService,
    private readonly dataSource: DataSource,
  ) { }

  // ===========================================================================
  // CRIAÇÃO DE VENDA
  // ===========================================================================

  /**
   * Cria uma nova venda.
   *
   * Passos executados dentro de uma única transação:
   *   1. Valida forma de pagamento e produtos
   *   2. Reserva estoque (dentro da transação via manager)
   *   3. Calcula valores e gera número de pedido
   *   4. Salva a venda e seus itens
   *   5. Se status = APROVADO, chama processarVendaAprovada()
   *
   * Em caso de erro, o rollback desfaz tudo — incluindo a reserva de estoque.
   */
  async create(dto: CreateVendaDto): Promise<Venda> {
    this.logger.log('Criando nova venda');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { manager } = queryRunner;

      // --- 1. Validar forma de pagamento ---
      const formaPagamento = await this.buscarFormaPagamento(
        dto.formaPagamentoId,
        manager,
      );

      // --- 2. Validar produtos ---
      await this.validarProdutos(dto.itens, manager);

      // --- 3. Reservar estoque (dentro da transação) ---
      const itensReserva: ItemEstoque[] = dto.itens.map((i) => ({
        produtoId: i.produtoId,
        quantidade: i.quantidade,
      }));
      await this.estoqueService.reservarParaVenda(itensReserva, manager);

      // --- 4. Calcular valores ---
      const valorProdutos = dto.itens.reduce(
        (sum, item) => sum + item.valorSubtotal,
        0,
      );
      const valorTotal =
        valorProdutos +
        (dto.valorFrete ?? 0) +
        (dto.valorSeguro ?? 0) +
        (dto.valorOutrasDespesas ?? 0) -
        (dto.valorDesconto ?? 0);

      // --- 5. Gerar número de pedido (sequencial seguro dentro da transação) ---
      const numeroPedido = await this.gerarNumeroPedido(manager);

      // --- 6. Criar e salvar a venda ---
      const venda = manager.create(Venda, {
        ...dto,
        numeroPedido,
        valorProdutos,
        valorTotal,
        statusVenda: dto.statusVenda ?? StatusVenda.ORCAMENTO,
        status: dto.status ?? StatusPagamento.AGUARDANDO,
      });

      const vendaSalva = await manager.save(venda);
      this.logger.log(
        `Venda criada | ID: ${vendaSalva.id} | Pedido: #${vendaSalva.numeroPedido} | Status: ${vendaSalva.statusVenda}`,
      );

      // --- 7. Processar aprovação imediata se já veio como APROVADO ---
      if (vendaSalva.statusVenda === StatusVenda.APROVADO) {
        // Recarrega com itens para ter acesso aos IDs gerados
        const vendaComItens = await manager.findOne(Venda, {
          where: { id: vendaSalva.id },
          relations: ['itens'],
        });

        if (!vendaComItens) {
          throw new Error('Erro interno: venda não encontrada após criação');
        }

        await this.processarVendaAprovada(vendaComItens, manager);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Transação commitada — Venda #${vendaSalva.numeroPedido}`);

      // Retorna a venda completa com todos os relacionamentos
      return this.findOne(vendaSalva.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Rollback executado na criação da venda — ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ===========================================================================
  // ATUALIZAÇÃO DE STATUS (APROVAÇÃO, CANCELAMENTO ETC.)
  // ===========================================================================

  /**
   * Altera o status de uma venda, executando as ações correspondentes:
   *   - APROVADO: confirma estoque, gera financeiro e comissões
   *   - CANCELADO: devolve estoque e cancela financeiro/comissões
   *
   * A transição de status é validada contra a máquina de estados
   * definida em `validarTransicaoStatus()`.
   *
   * @param vendaId   UUID da venda
   * @param novoStatus Novo status desejado
   * @param motivo    Motivo (obrigatório para cancelamento)
   */
  async atualizarStatus(
    vendaId: string,
    novoStatus: StatusVenda,
    motivo?: string,
  ): Promise<Venda> {
    this.logger.log(
      `Alterando status da venda ${vendaId} para ${novoStatus}`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { manager } = queryRunner;

      const venda = await manager.findOne(Venda, {
        where: { id: vendaId },
        relations: ['itens'],
      });

      if (!venda) {
        throw new NotFoundException(`Venda com ID ${vendaId} não encontrada`);
      }

      // Valida a transição antes de fazer qualquer alteração
      const statusAnterior = venda.statusVenda;
      this.validarTransicaoStatus(statusAnterior, novoStatus);

      // Atualiza o status
      venda.statusVenda = novoStatus;
      await manager.save(venda);

      // Executa ações específicas do novo status
      if (
        novoStatus === StatusVenda.APROVADO &&
        statusAnterior !== StatusVenda.APROVADO
      ) {
        await this.processarVendaAprovada(venda, manager);

      } else if (novoStatus === StatusVenda.CANCELADO) {
        await this.processarCancelamentoVenda(
          venda,
          statusAnterior,
          motivo ?? 'Cancelamento manual',
          manager,
        );
        await this.movimentarCaixa(venda.valorTotal, 'SAIDA', 'Extorno cancelamento de venda')
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `Status atualizado: ${statusAnterior} → ${novoStatus} | Venda #${venda.numeroPedido}`,
      );

      return this.findOne(venda.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Rollback na atualização de status — ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ===========================================================================
  // FATURAMENTO (EMISSÃO DE NF)
  // ===========================================================================

  /**
   * Registra os dados fiscais de uma venda (número NF, chave de acesso, XML).
   * Só é permitido para vendas com status APROVADO que ainda não foram faturadas.
   *
   * @param vendaId          UUID da venda
   * @param dadosFaturamento Dados retornados pela SEFAZ após autorização
   */
  async faturarVenda(
    vendaId: string,
    dadosFaturamento: FaturarVendaDto,
  ): Promise<Venda> {
    this.logger.log(`Faturando venda ${vendaId}`);

    const venda = await this.vendaRepository.findOne({
      where: { id: vendaId },
    });

    if (!venda) {
      throw new NotFoundException('Venda não encontrada');
    }

    if (venda.statusVenda !== StatusVenda.APROVADO) {
      throw new BadRequestException(
        'Apenas vendas aprovadas podem ser faturadas',
      );
    }

    if (venda.statusSefaz === StatusSefaz.AUTORIZADA) {
      throw new BadRequestException('Esta venda já foi faturada');
    }

    venda.numeroNf = dadosFaturamento.numeroNf;
    venda.serieNf = dadosFaturamento.serieNf;
    venda.chaveAcessoNfe = dadosFaturamento.chaveAcessoNfe;
    venda.dataEmissaoNfe = new Date();
    venda.xmlAutorizado = dadosFaturamento.xml ?? null;
    venda.status = StatusPagamento.FATURADO;
    venda.statusSefaz = StatusSefaz.AUTORIZADA;

    const vendaFaturada = await this.vendaRepository.save(venda);
    this.logger.log(
      `Venda #${venda.numeroPedido} faturada — NF: ${dadosFaturamento.numeroNf}`,
    );

    return vendaFaturada;
  }

  // ===========================================================================
  // MOVIMENTAÇÃO DE CAIXA
  // ===========================================================================

  /**
   * Registra uma entrada ou saída no caixa principal.
   * Chamado pelo ContasReceberService ao liquidar uma conta.
   *
   * IMPORTANTE: Para garantir atomicidade, prefira chamar `movimentarCaixaComManager`
   * quando estiver dentro de uma transação.
   *
   * @param valor     Valor absoluto (positivo)
   * @param tipo      'ENTRADA' ou 'SAIDA'
   * @param descricao Descrição legível da movimentação
   */
  async movimentarCaixa(
    valor: number,
    tipo: 'ENTRADA' | 'SAIDA',
    descricao: string,
  ): Promise<void> {
    await this.movimentarCaixaComManager(valor, tipo, descricao);
  }

  /**
   * Versão da movimentação de caixa que aceita EntityManager.
   * Use este método quando a movimentação precisar participar de uma transação.
   *
   * @param valor     Valor absoluto (positivo)
   * @param tipo      'ENTRADA' ou 'SAIDA'
   * @param descricao Descrição legível da movimentação
   * @param manager   EntityManager da transação (opcional)
   */
  async movimentarCaixaComManager(
    valor: number,
    tipo: 'ENTRADA' | 'SAIDA',
    descricao: string,
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.log(
      `Movimentação de caixa — Tipo: ${tipo} | Valor: R$ ${valor.toFixed(2)} | ${descricao}`,
    );

    const caixaRepo = manager
      ? manager.getRepository(Caixa)
      : this.caixaRepository;

    const caixa = await caixaRepo.findOne({ where: { id: 'PRINCIPAL' } });

    if (!caixa) {
      throw new NotFoundException('Caixa principal não encontrado');
    }

    if (tipo === 'ENTRADA') {
      caixa.saldoAtual = Number(caixa.saldoAtual) + valor;
    } else {
      if (Number(caixa.saldoAtual) < valor) {
        throw new BadRequestException(
          `Saldo insuficiente no caixa. Disponível: R$ ${Number(caixa.saldoAtual).toFixed(2)}`,
        );
      }
      caixa.saldoAtual = Number(caixa.saldoAtual) - valor;
    }

    caixa.ultimaAtualizacao = new Date();
    await caixaRepo.save(caixa);

    this.logger.log(
      `Caixa atualizado — Novo saldo: R$ ${Number(caixa.saldoAtual).toFixed(2)}`,
    );
  }

  // ===========================================================================
  // CONSULTAS
  // ===========================================================================

  /**
   * Lista vendas com suporte a paginação e filtros dinâmicos.
   *
   * @param page    Página (1-indexed)
   * @param limit   Quantidade de itens por página
   * @param filtros Filtros opcionais: statusVenda, clienteId, dataInicio, dataFim
   */
  async findAll(
    page = 1,
    limit = 10,
    filtros?: {
      statusVenda?: StatusVenda;
      clienteId?: string;
      dataInicio?: Date;
      dataFim?: Date;
    },
  ): Promise<{ data: Venda[]; total: number }> {
    const query = this.vendaRepository
      .createQueryBuilder('venda')
      .leftJoinAndSelect('venda.cliente', 'cliente')
      .leftJoinAndSelect('venda.vendedor', 'vendedor')
      .leftJoinAndSelect('venda.itens', 'itens')
      .orderBy('venda.createdAt', 'DESC');

    if (filtros?.statusVenda) {
      query.andWhere('venda.statusVenda = :statusVenda', {
        statusVenda: filtros.statusVenda,
      });
    }

    if (filtros?.clienteId) {
      query.andWhere('venda.clienteId = :clienteId', {
        clienteId: filtros.clienteId,
      });
    }

    if (filtros?.dataInicio && filtros?.dataFim) {
      query.andWhere('venda.createdAt BETWEEN :dataInicio AND :dataFim', {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
      });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Busca uma venda pelo ID com todos os relacionamentos necessários para exibição.
   * @throws NotFoundException se a venda não for encontrada
   */
  async findOne(id: string): Promise<Venda> {
    const venda = await this.vendaRepository.findOne({
      where: { id },
      relations: [
        'cliente',
        'vendedor',
        'itens',
        'itens.produto',
        'formaPagamento',
        'romaneio',
        'contasReceber',
        'comissoes',
      ],
    });

    if (!venda) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada`);
    }

    return venda;
  }

  /** Lista todas as vendas de um cliente específico */
  async findByCliente(clienteId: string): Promise<Venda[]> {
    return this.vendaRepository.find({
      where: { clienteId },
      relations: ['itens', 'itens.produto'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Lista todas as vendas de um vendedor específico */
  async findByVendedor(vendedorId: string): Promise<Venda[]> {
    return this.vendaRepository.find({
      where: { vendedorId },
      relations: ['cliente', 'itens'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca uma venda junto com o endereço de entrega preferencial do cliente.
   * Útil para geração de romaneios e documentos de transporte.
   */
  async findOneWithEndereco(
    id: string,
  ): Promise<{ venda: Venda; enderecoEntrega: Endereco | null }> {
    const venda = await this.vendaRepository.findOne({
      where: { id },
      relations: ['itens', 'itens.produto', 'cliente', 'vendedor', 'formaPagamento'],
    });

    if (!venda) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada`);
    }

    let enderecoEntrega: Endereco | null = null;
    if (venda.cliente) {
      enderecoEntrega = await this.enderecosService.findEnderecoPreferencial(
        venda.cliente.id,
      );
    }

    return { venda, enderecoEntrega };
  }

  /**
   * Retorna dados agregados para o dashboard de vendas do mês atual.
   * Inclui total em vendas, ticket médio, distribuição por status e últimas vendas.
   */
  async getDashboardData(): Promise<any> {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const vendasMes = await this.vendaRepository
      .createQueryBuilder('venda')
      .where('venda.createdAt BETWEEN :inicio AND :fim', {
        inicio: inicioMes,
        fim: fimMes,
      })
      .andWhere('venda.statusVenda != :cancelado', {
        cancelado: StatusVenda.CANCELADO,
      })
      .getMany();

    const totalVendas = vendasMes.reduce(
      (sum, v) => sum + Number(v.valorTotal),
      0,
    );
    const totalPedidos = vendasMes.length;
    const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

    const vendasPorStatus = await this.vendaRepository
      .createQueryBuilder('venda')
      .select('venda.statusVenda', 'status')
      .addSelect('COUNT(*)', 'quantidade')
      .addSelect('SUM(venda.valorTotal)', 'valor')
      .groupBy('venda.statusVenda')
      .getRawMany();

    const ultimasVendas = await this.findAll(1, 5);

    return {
      periodo: { inicio: inicioMes, fim: fimMes },
      totais: { valorTotal: totalVendas, quantidadePedidos: totalPedidos, ticketMedio },
      vendasPorStatus,
      ultimasVendas: ultimasVendas.data,
    };
  }

  // ===========================================================================
  // ATUALIZAÇÃO E REMOÇÃO
  // ===========================================================================

  /**
   * Atualiza dados de uma venda. Só é permitido enquanto o status for ORÇAMENTO.
   * @throws BadRequestException se a venda já estiver aprovada ou em outro estado avançado
   */
  async update(id: string, dto: UpdateVendaDto): Promise<Venda> {
    const venda = await this.findOne(id);

    if (venda.statusVenda !== StatusVenda.ORCAMENTO) {
      throw new BadRequestException(
        `Apenas orçamentos podem ser alterados. Status atual: ${venda.statusVenda}`,
      );
    }

    const vendaAtualizada = await this.vendaRepository.preload({ id, ...dto });

    if (!vendaAtualizada) {
      throw new NotFoundException('Venda não encontrada');
    }

    return this.vendaRepository.save(vendaAtualizada);
  }

  /**
   * Remove uma venda. Só é permitido para orçamentos — vendas aprovadas devem ser canceladas.
   * Cancela a reserva de estoque antes de excluir.
   */
  async remove(id: string): Promise<void> {
    const venda = await this.findOne(id);

    if (venda.statusVenda !== StatusVenda.ORCAMENTO) {
      throw new BadRequestException(
        'Apenas orçamentos podem ser excluídos. Cancele a venda antes de excluir.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { manager } = queryRunner;

      // Cancela reserva de estoque
      const itensReserva: ItemEstoque[] = venda.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
      }));
      await this.estoqueService.cancelarReserva(itensReserva, manager);

      await manager.remove(venda.itens);
      await manager.remove(venda);

      await queryRunner.commitTransaction();
      this.logger.log(`Venda #${venda.numeroPedido} removida`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS — lógica interna
  // ===========================================================================

  /**
   * Processa todos os efeitos colaterais de uma venda aprovada, dentro da transação.
   *
   * Ordem de execução:
   *   1. Confirma saída do estoque (reserva → saída real)
   *   2. Registra movimentações de estoque para auditoria
   *   3. Gera contas a receber (se houver cliente)
   *   4. Gera comissão do vendedor (se houver vendedor)
   *
   * @param venda   Venda com itens carregados
   * @param manager EntityManager da transação ativa
   */
  private async processarVendaAprovada(
    venda: Venda,
    manager: EntityManager,
  ): Promise<void> {
    this.logger.log(
      `Processando aprovação da venda #${venda.numeroPedido}`,
    );

    // 1. Confirmar saída do estoque (dentro da transação)
    const itensSaida: ItemEstoque[] = venda.itens.map((item) => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
    }));
    await this.estoqueService.confirmarSaida(itensSaida, manager);

    // 2. Registrar movimentações para rastreabilidade
    for (const item of venda.itens) {
      const movimentacao = manager.create(MovimentacaoEstoque, {
        tipo: TipoMovimentacao.SAIDA,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        vendaItemId: item.id,
        motivo: `Venda aprovada #${venda.numeroPedido}`,
        usuarioId: venda.vendedorId,
      });
      await manager.save(movimentacao);
    }

    // 3. Gerar financeiro (contas a receber)
    if (venda.clienteId) {
      await this.gerarFinanceiro(venda, manager);
    } else {
      this.logger.warn(
        `Venda #${venda.numeroPedido} sem cliente — contas a receber não geradas`,
      );
    }

    // 4. Gerar comissão
    const comissao = await this.comissoesService.gerarComissoesDaVenda(
      venda.id,
      manager,
    );

    if (comissao) {
      this.logger.log(
        `Comissão gerada — ID: ${comissao.id} | Valor: R$ ${comissao.valorComissao}`,
      );
    } else {
      this.logger.warn(
        `Comissão não gerada para venda #${venda.numeroPedido} (vendedor sem configuração ou ausente)`,
      );
    }

    this.logger.log(
      `Venda #${venda.numeroPedido} processada com sucesso`,
    );
  }

  /**
   * Processa o cancelamento de uma venda, revertendo todos os efeitos colaterais
   * de acordo com o status anterior da venda.
   *
   * Lógica:
   *   - Se estava APROVADO ou posterior: devolve estoque, cancela contas/comissões
   *   - Se estava ORÇAMENTO: apenas cancela a reserva de estoque
   *
   * CORREÇÃO DE BUG: o parâmetro `statusAnterior` foi adicionado pois a venda
   * já tem o novo status (CANCELADO) quando este método é chamado — consultar
   * `venda.statusVenda` daria sempre CANCELADO, fazendo a devolução de estoque
   * nunca executar.
   *
   * @param venda          Venda a cancelar (com itens carregados)
   * @param statusAnterior Status da venda ANTES de ser cancelada
   * @param motivo         Motivo do cancelamento
   * @param manager        EntityManager da transação ativa
   */
  private async processarCancelamentoVenda(
    venda: Venda,
    statusAnterior: StatusVenda,
    motivo: string,
    manager: EntityManager,
  ): Promise<void> {
    this.logger.log(
      `Processando cancelamento da venda #${venda.numeroPedido} (era: ${statusAnterior}) — Motivo: ${motivo}`,
    );

    const foiAprovada = [
      StatusVenda.APROVADO,
      StatusVenda.EM_SEPARACAO,
      StatusVenda.ENVIADO,
      StatusVenda.ENTREGUE,
    ].includes(statusAnterior);

    if (foiAprovada) {
      // --- Venda aprovada: devolve estoque e cancela financeiro ---

      // 1. Devolver estoque (quantidade física, reserva já foi consumida)
      const itensDevolucao: ItemEstoque[] = venda.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
      }));
      await this.estoqueService.devolverEstoque(itensDevolucao, manager);

      // 2. Registrar movimentações de entrada por cancelamento
      for (const item of venda.itens) {
        const movimentacao = manager.create(MovimentacaoEstoque, {
          tipo: TipoMovimentacao.ENTRADA,
          produtoId: item.produtoId,
          loteId: item.loteId,
          vendaItemId: item.id,
          quantidade: item.quantidade,
          motivo: `Cancelamento da venda #${venda.numeroPedido} — ${motivo}`,
          usuarioId: venda.vendedorId,
        });
        await manager.save(movimentacao);
      }

      // 3. Cancelar contas a receber
      const contas = await manager.find(ContaReceber, {
        where: { vendaId: venda.id },
      });

      for (const conta of contas) {
        conta.status = StatusContaReceber.CANCELADO;
        await manager.save(conta);
      }

      this.logger.log(
        `${contas.length} conta(s) a receber cancelada(s)`,
      );

      // 4. Cancelar comissões
      await this.comissoesService.cancelarComissoesDaVenda(
        venda.id,
        motivo,
        manager,
      );
    } else {
      // --- Venda em orçamento: apenas cancela a reserva ---
      const itensReserva: ItemEstoque[] = venda.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
      }));
      await this.estoqueService.cancelarReserva(itensReserva, manager);
    }

    this.logger.log(
      `Cancelamento da venda #${venda.numeroPedido} processado`,
    );
  }

  /**
   * Gera as contas a receber para uma venda aprovada.
   * O vencimento é calculado com base nos dias configurados na forma de pagamento.
   *
   * @param venda   Venda aprovada
   * @param manager EntityManager da transação ativa
   */
  private async gerarFinanceiro(
    venda: Venda,
    manager: EntityManager,
  ): Promise<void> {
    const formaPagamento = await manager.findOne(FormasPagamento, {
      where: { id: venda.formaPagamentoId },
    });

    if (!formaPagamento) {
      throw new NotFoundException(
        `Forma de pagamento ID ${venda.formaPagamentoId} não encontrada`,
      );
    }

    const dataVencimento = new Date();
    dataVencimento.setDate(
      dataVencimento.getDate() + (formaPagamento.diasRecebimento ?? 0),
    );

    const contaReceber = manager.create(ContaReceber, {
      vendaId: venda.id,
      clienteId: venda.clienteId,
      valorParcela: venda.valorTotal,
      valorAberto: venda.valorTotal,
      dataVencimento,
      formaPagamentoId: formaPagamento.id,
      status: StatusContaReceber.PENDENTE,
      numeroParcela: 1,
      totalParcelas: 1,
    });

    const saved = await manager.save(contaReceber);
    this.logger.log(
      `Conta a receber criada — ID: ${saved.id} | Vencimento: ${dataVencimento.toISOString().split('T')[0]} | Valor: R$ ${venda.valorTotal}`,
    );
  }

  /**
   * Gera o próximo número de pedido de forma segura dentro de uma transação.
   * Usando a mesma transação, evita duplicatas em acessos simultâneos.
   *
   * @param manager EntityManager da transação ativa
   */
  private async gerarNumeroPedido(manager: EntityManager): Promise<number> {
    const ultimoPedido = await manager
      .createQueryBuilder(Venda, 'venda')
      .select('MAX(venda.numeroPedido)', 'max')
      .getRawOne<{ max: number | null }>();

    return (ultimoPedido?.max ?? 0) + 1;
  }


  async updateFull(id: string, dto: CreateVendaDto): Promise<Venda> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { manager } = queryRunner;

    const venda = await manager.findOne(Venda, {
      where: { id },
      relations: ['itens'],
    });

    if (!venda) throw new NotFoundException(`Venda com ID ${id} não encontrada`);

    if (venda.statusVenda !== StatusVenda.ORCAMENTO) {
      throw new BadRequestException(
        `Apenas orçamentos podem ser editados. Status atual: ${venda.statusVenda}`,
      );
    }

    await this.buscarFormaPagamento(dto.formaPagamentoId, manager);
    await this.validarProdutos(dto.itens, manager);

    // 1. Cancela reserva dos itens ANTIGOS
    if (venda.itens.length > 0) {
      const itensAntigos: ItemEstoque[] = venda.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
      }));
      await this.estoqueService.cancelarReserva(itensAntigos, manager);

      // Remove itens antigos explicitamente (evita conflito no cascade)
      await manager.delete(VendaItem, { vendaId: venda.id });
    }

    // 2. Reserva estoque dos NOVOS itens
    const novosItensReserva: ItemEstoque[] = dto.itens.map((i) => ({
      produtoId: i.produtoId,
      quantidade: i.quantidade,
    }));
    await this.estoqueService.reservarParaVenda(novosItensReserva, manager);

    // 3. Recalcula valores
    const valorProdutos = dto.itens.reduce((sum, item) => sum + item.valorSubtotal, 0);
    const valorTotal =
      valorProdutos +
      (dto.valorFrete ?? 0) +
      (dto.valorSeguro ?? 0) +
      (dto.valorOutrasDespesas ?? 0) -
      (dto.valorDesconto ?? 0);

    // 4. Atualiza campos da venda (sem criar nova)
    await manager.update(Venda, { id }, {
      clienteId: dto.clienteId,
      formaPagamentoId: dto.formaPagamentoId,
      valorFrete: dto.valorFrete ?? 0,
      valorDesconto: dto.valorDesconto ?? 0,
      valorSeguro: dto.valorSeguro ?? 0,
      valorOutrasDespesas: dto.valorOutrasDespesas ?? 0,
      valorProdutos,
      valorTotal,
      observacoesCliente: dto.observacoesCliente ?? venda.observacoesCliente,
      statusVenda: dto.statusVenda ?? StatusVenda.ORCAMENTO,
    });

    // 5. Insere novos itens explicitamente
    const novosItens = dto.itens.map((item) =>
      manager.create(VendaItem, { ...item, vendaId: id }),
    );
    await manager.save(VendaItem, novosItens);

    // 6. Recarrega a venda atualizada com itens
    const vendaAtualizada = await manager.findOne(Venda, {
      where: { id },
      relations: ['itens'],
    });

    if (!vendaAtualizada) throw new Error('Erro interno: venda não encontrada após atualização');

    // 7. Processa aprovação imediata se necessário
    if (vendaAtualizada.statusVenda === StatusVenda.APROVADO) {
      await this.processarVendaAprovada(vendaAtualizada, manager);
    }

    await queryRunner.commitTransaction();
    this.logger.log(`Venda #${venda.numeroPedido} atualizada com sucesso`);

    return this.findOne(id);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    this.logger.error(`Rollback na atualização completa da venda ${id} — ${error.message}`, error.stack);
    throw error;
  } finally {
    await queryRunner.release();
  }
}


  /**
   * Valida que a transição de status é permitida pela máquina de estados.
   *
   * Transições permitidas:
   *   ORÇAMENTO   → APROVADO, CANCELADO
   *   APROVADO    → EM_SEPARACAO, ENVIADO, CANCELADO
   *   EM_SEPARACAO→ ENVIADO, CANCELADO
   *   ENVIADO     → ENTREGUE, CANCELADO
   *   ENTREGUE    → CANCELADO
   *   CANCELADO   → (nenhuma)
   *
   * @throws BadRequestException se a transição não for permitida
   */
  private validarTransicaoStatus(
    atual: StatusVenda,
    novo: StatusVenda,
  ): void {
    const transicoesPermitidas: Record<StatusVenda, StatusVenda[]> = {
      [StatusVenda.ORCAMENTO]: [StatusVenda.APROVADO, StatusVenda.CANCELADO],
      [StatusVenda.APROVADO]: [
        StatusVenda.EM_SEPARACAO,
        StatusVenda.ENVIADO,
        StatusVenda.CANCELADO,
      ],
      [StatusVenda.EM_SEPARACAO]: [StatusVenda.ENVIADO, StatusVenda.CANCELADO],
      [StatusVenda.ENVIADO]: [StatusVenda.ENTREGUE, StatusVenda.CANCELADO],
      [StatusVenda.ENTREGUE]: [StatusVenda.CANCELADO],
      [StatusVenda.CANCELADO]: [],
    };

    const permitidas = transicoesPermitidas[atual] ?? [];

    if (!permitidas.includes(novo)) {
      throw new BadRequestException(
        `Transição de status inválida: ${atual} → ${novo}. ` +
        `Transições permitidas: ${permitidas.join(', ') || 'nenhuma'}`,
      );
    }
  }

  /**
   * Busca e valida a existência de uma forma de pagamento.
   * @throws NotFoundException se não for encontrada
   */
  private async buscarFormaPagamento(
    id: number,
    manager: EntityManager,
  ): Promise<FormasPagamento> {
    const forma = await manager.findOne(FormasPagamento, { where: { id } });

    if (!forma) {
      throw new NotFoundException(
        `Forma de pagamento com ID ${id} não encontrada`,
      );
    }

    return forma;
  }

  /**
   * Valida a existência de todos os produtos de uma venda e que as quantidades são positivas.
   * Falha rápido antes de qualquer escrita no banco.
   *
   * @throws NotFoundException se algum produto não existir
   * @throws BadRequestException se alguma quantidade for inválida
   */
  private async validarProdutos(
    itens: CreateVendaDto['itens'],
    manager: EntityManager,
  ): Promise<void> {
    for (const item of itens) {
      if (item.quantidade <= 0) {
        throw new BadRequestException(
          `Quantidade inválida (${item.quantidade}) para o produto ${item.produtoId}`,
        );
      }

      const existe = await manager.findOne(Produto, {
        where: { id: item.produtoId },
      });

      if (!existe) {
        throw new NotFoundException(
          `Produto com ID ${item.produtoId} não encontrado no catálogo`,
        );
      }
    }
  }

  /**
   * @deprecated Use comissoesService.gerarComissoesDaVenda() com o EntityManager.
   * Mantido apenas para compatibilidade com código legado.
   */
  async gerarComissoes(venda: Venda): Promise<void> {
    this.logger.warn(
      'Método legado gerarComissoes() chamado. Migre para comissoesService.gerarComissoesDaVenda()',
    );
    await this.comissoesService.gerarComissoesDaVenda(venda.id);
  }
}
