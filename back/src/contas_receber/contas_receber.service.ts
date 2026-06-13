/**
 * @file contas_receber.service.ts
 * @description Serviço responsável pelo gerenciamento de contas a receber.
 *
 * REGRAS DE NEGÓCIO:
 *   - Contas a receber são geradas automaticamente pelo VendasService ao aprovar uma venda
 *   - O método `liquidar` permite pagamento total ou parcial de uma conta
 *   - Ao liquidar, o caixa é movimentado NA MESMA TRANSAÇÃO — garantindo consistência
 *   - Ao liquidar totalmente (valorAberto = 0), as comissões da venda são liberadas
 *
 * TRANSAÇÕES:
 *   O método `liquidar` envolve conta + caixa + comissão em uma única transação.
 *   Se o caixa não puder ser movimentado (ex: saldo insuficiente), a conta não é salva.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ContaReceber, StatusContaReceber } from './entities/contas_receber.entity';
import { LiquidarContaDto } from './dto/liquidar-conta.dto';
import { UpdateContaDto } from './dto/update-contas_receber.dto';
import { VendasService } from '../vendas/vendas.service';
import { ComissoesService } from '../comissoes/comissoes.service';

@Injectable()
export class ContasReceberService {
  private readonly logger = new Logger(ContasReceberService.name);

  constructor(
    @InjectRepository(ContaReceber)
    private readonly repository: Repository<ContaReceber>,

    /**
     * forwardRef necessário pois VendasService e ContasReceberService
     * se referenciam mutuamente (dependência circular).
     */
    @Inject(forwardRef(() => VendasService))
    private readonly vendasService: VendasService,

    private readonly comissoesService: ComissoesService,
    private readonly dataSource: DataSource,
  ) {}

  // ===========================================================================
  // CONSULTAS
  // ===========================================================================

  /**
   * Lista contas a receber com filtros opcionais.
   * Ordenadas por vencimento ascendente (mais urgentes primeiro).
   *
   * @param filters Filtros opcionais: status, clienteId, período de vencimento
   */
  async findAll(filters?: {
    status?: StatusContaReceber;
    clienteId?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }): Promise<ContaReceber[]> {
    const query = this.repository
      .createQueryBuilder('conta')
      .leftJoinAndSelect('conta.cliente', 'cliente')
      .leftJoinAndSelect('conta.formaPagamento', 'formaPagamento')
      .orderBy('conta.dataVencimento', 'ASC');

    if (filters?.status) {
      query.andWhere('conta.status = :status', { status: filters.status });
    }

    if (filters?.clienteId) {
      query.andWhere('conta.clienteId = :clienteId', {
        clienteId: filters.clienteId,
      });
    }

    if (filters?.dataInicio && filters?.dataFim) {
      query.andWhere('conta.dataVencimento BETWEEN :inicio AND :fim', {
        inicio: filters.dataInicio,
        fim: filters.dataFim,
      });
    }

    return query.getMany();
  }

  /**
   * Busca uma conta a receber pelo ID com cliente, forma de pagamento e venda.
   * @throws NotFoundException se não encontrada
   */
  async findOne(id: string): Promise<ContaReceber> {
    const conta = await this.repository.findOne({
      where: { id },
      relations: ['cliente', 'formaPagamento', 'venda'],
    });

    if (!conta) {
      throw new NotFoundException('Conta a receber não encontrada');
    }

    return conta;
  }

  /**
   * Retorna um resumo financeiro das contas pendentes:
   *   - Total a receber (soma dos valores abertos)
   *   - Total vencido (vencimento < hoje)
   *   - Total a vencer nos próximos 7 dias
   *   - Quantidade total de contas pendentes
   */
  async getResumo(): Promise<{
    totalAReceber: number;
    vencido: number;
    aVencer7Dias: number;
    totalContas: number;
  }> {
    const hoje = new Date();
    const contas = await this.repository.find({
      where: { status: StatusContaReceber.PENDENTE },
    });

    const totalAReceber = contas.reduce(
      (sum, conta) => sum + Number(conta.valorAberto),
      0,
    );

    const vencido = contas
      .filter((conta) => new Date(conta.dataVencimento) < hoje)
      .reduce((sum, conta) => sum + Number(conta.valorAberto), 0);

    const aVencer7Dias = contas
      .filter((conta) => {
        const diffMs =
          new Date(conta.dataVencimento).getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays > 0;
      })
      .reduce((sum, conta) => sum + Number(conta.valorAberto), 0);

    return {
      totalAReceber,
      vencido,
      aVencer7Dias,
      totalContas: contas.length,
    };
  }

  // ===========================================================================
  // LIQUIDAÇÃO (RECEBIMENTO)
  // ===========================================================================

  /**
   * Registra o pagamento (total ou parcial) de uma conta a receber.
   *
   * Operações realizadas dentro de UMA ÚNICA TRANSAÇÃO:
   *   1. Atualiza valorPago, valorAberto, status da conta
   *   2. Movimenta o caixa principal (ENTRADA)
   *   3. Se conta foi totalmente paga: libera a comissão vinculada à venda
   *
   * @param id  UUID da conta a receber
   * @param dto Dados do pagamento
   *
   * @throws BadRequestException se a conta já estiver paga
   * @throws NotFoundException se a conta não for encontrada
   */
  async liquidar(
    id: string,
    dto: LiquidarContaDto & { formaPagamentoId?: number },
  ): Promise<ContaReceber> {
    this.logger.log(`Liquidando conta a receber ${id}`);

    return await this.dataSource.transaction(async (manager) => {
      // Busca a conta dentro da transação para garantir dados atuais
      const conta = await manager.findOne(ContaReceber, {
        where: { id },
        relations: ['cliente'],
      });

      if (!conta) {
        throw new NotFoundException('Conta a receber não encontrada');
      }

      if (conta.status === StatusContaReceber.PAGO) {
        throw new BadRequestException('Esta conta já está paga');
      }

      if (conta.status === StatusContaReceber.CANCELADO) {
        throw new BadRequestException('Esta conta foi cancelada');
      }

      // --- Calcular novos valores ---
      const acrescimos = dto.acrescimos ?? 0;
      const descontos = dto.descontos ?? 0;
      const valorEfetivo = dto.valorPago + acrescimos - descontos;

      conta.valorPago = Number(conta.valorPago ?? 0) + dto.valorPago;
      conta.acrescimos = Number(conta.acrescimos ?? 0) + acrescimos;
      conta.descontos = Number(conta.descontos ?? 0) + descontos;
      conta.valorAberto = Math.max(
        0,
        Number(conta.valorAberto) - valorEfetivo,
      );
      conta.dataPagamento = dto.dataPagamento
        ? new Date(dto.dataPagamento)
        : new Date();

      if (dto.formaPagamentoId) {
        conta.formaPagamentoId = dto.formaPagamentoId;
      }

      // Atualiza status com base no saldo restante
      conta.status =
        conta.valorAberto === 0
          ? StatusContaReceber.PAGO
          : StatusContaReceber.PENDENTE;

      const contaSalva = await manager.save(conta);

      this.logger.log(
        `Conta ${id} — Pago: R$ ${dto.valorPago} | Aberto restante: R$ ${conta.valorAberto} | Status: ${conta.status}`,
      );

      // --- Movimentar caixa DENTRO da transação ---
      await this.vendasService.movimentarCaixaComManager(
        dto.valorPago,
        'ENTRADA',
        `Recebimento conta ${id} — ${conta.cliente?.nomeRazaoSocial ?? 'Cliente não informado'}`,
        manager,
      );

      // --- Liberar comissão se conta foi totalmente paga ---
      if (conta.status === StatusContaReceber.PAGO && conta.vendaId) {
        const comissaoLiberada =
          await this.comissoesService.liberarComissoesPorRecebimento(
            contaSalva.id,
            manager,
          );

        if (comissaoLiberada) {
          this.logger.log(
            `Comissão ${comissaoLiberada.id} liberada após recebimento total`,
          );
        }
      }

      return contaSalva;
    });
  }

  // ===========================================================================
  // ATUALIZAÇÃO MANUAL
  // ===========================================================================

  /**
   * Atualiza dados administrativos de uma conta (ex: data de vencimento, observações).
   * Para registrar pagamentos, use o método `liquidar`.
   *
   * Se o status for alterado manualmente para PAGO, zera o valorAberto e
   * registra a data de pagamento.
   */
  async update(id: string, dto: UpdateContaDto): Promise<ContaReceber> {
    const conta = await this.findOne(id);

    Object.assign(conta, dto);

    // Se marcado como pago manualmente, garante que o saldo fique zerado
    if (dto.status === StatusContaReceber.PAGO && conta.valorAberto > 0) {
      conta.valorAberto = 0;
      conta.dataPagamento = conta.dataPagamento ?? new Date();
    }

    return this.repository.save(conta);
  }
}
