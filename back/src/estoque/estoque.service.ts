/**
 * @file estoque.service.ts
 * @description Serviço responsável por todas as operações de estoque.
 *
 * IMPORTANTE — DESIGN DE TRANSAÇÕES:
 * Todos os métodos que alteram dados aceitam um parâmetro opcional `manager: EntityManager`.
 * Quando `manager` é fornecido (vindo do VendasService, por exemplo), as operações
 * participam da transação já existente — garantindo que estoque + financeiro + comissões
 * sejam salvos ou revertidos em conjunto.
 * Quando `manager` é omitido, o método usa seu próprio repositório e opera de forma independente.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Estoque } from './entities/estoque.entity';
import { Produto } from 'src/produtos/entities/produto.entity';

/** Estrutura de item para operações em lote de estoque */
export interface ItemEstoque {
  produtoId: string;
  quantidade: number;
}

@Injectable()
export class EstoqueService {
  private readonly logger = new Logger(EstoqueService.name);

  constructor(
    @InjectRepository(Estoque)
    private readonly estoqueRepository: Repository<Estoque>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
  ) {}

  // ---------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // ---------------------------------------------------------------------------

  /**
   * Retorna o repositório correto dependendo se está dentro de uma transação externa.
   * Centraliza a lógica de "manager ou repositório próprio" em um único lugar.
   */
  private repo(manager?: EntityManager): Repository<Estoque> {
    return manager ? manager.getRepository(Estoque) : this.estoqueRepository;
  }

  // ---------------------------------------------------------------------------
  // OPERAÇÕES DE LEITURA
  // ---------------------------------------------------------------------------

  /**
   * Lista todo o estoque com o produto relacionado, ordenado por nome.
   */
  async listarEstoque(): Promise<Estoque[]> {
    this.logger.log('Listando estoque completo');
    return this.estoqueRepository.find({
      relations: ['produto'],
      order: { produto: { nome: 'ASC' } },
    });
  }

  /**
   * Retorna o registro de estoque de um produto específico.
   * @returns `null` se não existir registro para o produto.
   */
  async findOneByProduto(produtoId: string): Promise<Estoque | null> {
    return this.estoqueRepository.findOne({
      where: { produto: { id: produtoId } },
      relations: ['produto'],
    });
  }

  /**
   * Retorna a quantidade disponível (total - reservada) de um produto.
   * @returns `0` se não existir registro de estoque para o produto.
   */
  async consultarDisponivel(produtoId: string): Promise<number> {
    const estoque = await this.estoqueRepository.findOne({
      where: { produto: { id: produtoId } },
    });
    return estoque ? estoque.quantidadeDisponivel : 0;
  }

  // ---------------------------------------------------------------------------
  // OPERAÇÕES DE ESCRITA — aceitam EntityManager para participar de transações
  // ---------------------------------------------------------------------------

  /**
   * Registra uma entrada de estoque (compra, devolução, ajuste para cima).
   * Atualiza o custo médio ponderado se `custoUnitario` for informado.
   *
   * @param dados   Dados da entrada
   * @param manager EntityManager opcional — use quando chamar dentro de uma transação
   */
  async entradaEstoque(
    dados: {
      produtoId: string;
      quantidade: number;
      custoUnitario?: number;
      motivo: string;
      usuarioId: string;
      localizacao?: string;
    },
    manager?: EntityManager,
  ): Promise<Estoque> {
    this.logger.log(
      `Entrada de estoque — Produto: ${dados.produtoId}, Qtd: ${dados.quantidade}`,
    );

    const repo = this.repo(manager);

    // Valida existência do produto
    const produtoRepo = manager
      ? manager.getRepository(Produto)
      : this.produtoRepository;

    const produto = await produtoRepo.findOne({
      where: { id: dados.produtoId },
    });
    if (!produto) {
      throw new NotFoundException(
        `Produto com ID ${dados.produtoId} não encontrado`,
      );
    }

    // Busca ou cria o registro de estoque
    let estoque = await repo.findOne({
      where: { produto: { id: dados.produtoId } },
    });

    if (!estoque) {
      this.logger.log(
        `Criando novo registro de estoque para produto ${dados.produtoId}`,
      );
      estoque = repo.create({
        produto,
        quantidade: 0,
        quantidadeReservada: 0,
        custoMedio: dados.custoUnitario ?? 0,
        localizacao: dados.localizacao,
      });
    } else if (dados.localizacao) {
      estoque.localizacao = dados.localizacao;
    }

    // Custo médio ponderado: (qtd_atual × custo_atual + qtd_nova × custo_novo) / qtd_total
    if (dados.custoUnitario && dados.custoUnitario > 0) {
      const valorAtual = estoque.quantidade * (estoque.custoMedio ?? 0);
      const valorNovo = dados.quantidade * dados.custoUnitario;
      const qtdTotal = estoque.quantidade + dados.quantidade;

      estoque.custoMedio =
        qtdTotal > 0
          ? (valorAtual + valorNovo) / qtdTotal
          : dados.custoUnitario;

      this.logger.log(
        `Novo custo médio calculado: R$ ${estoque.custoMedio.toFixed(4)}`,
      );
    }

    estoque.quantidade += dados.quantidade;

    const saved = await repo.save(estoque);
    this.logger.log(
      `Entrada concluída — Novo saldo: ${saved.quantidade} | Reservado: ${saved.quantidadeReservada} | Disponível: ${saved.quantidadeDisponivel}`,
    );
    return saved;
  }

  /**
   * Reserva estoque para uma venda (aumenta `quantidadeReservada`).
   *
   * Verifica PRIMEIRO se há disponibilidade para TODOS os itens antes de reservar
   * qualquer um — evitando reservas parciais que deixariam o estado inconsistente.
   *
   * @param itens   Lista de itens a reservar
   * @param manager EntityManager opcional — use dentro de uma transação
   *
   * @throws BadRequestException se qualquer item não tiver estoque suficiente
   */
  async reservarParaVenda(
    itens: ItemEstoque[],
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.log(`Reservando estoque para ${itens.length} item(s)`);
    const repo = this.repo(manager);

    // --- FASE 1: Validação total (falha rápida, sem side-effects) ---
    for (const item of itens) {
      const estoque = await repo.findOne({
        where: { produto: { id: item.produtoId } },
      });

      const disponivel = estoque?.quantidadeDisponivel ?? 0;

      if (disponivel < item.quantidade) {
        this.logger.warn(
          `Estoque insuficiente — Produto ${item.produtoId}: disponível ${disponivel}, necessário ${item.quantidade}`,
        );
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${item.produtoId}. ` +
            `Disponível: ${disponivel}, Necessário: ${item.quantidade}`,
        );
      }
    }

    // --- FASE 2: Reserva (apenas se todos passaram na validação) ---
    for (const item of itens) {
      /**
       * Usa UPDATE atômico (sem SELECT + UPDATE) para evitar race conditions
       * em ambientes com múltiplas requisições simultâneas.
       */
      await repo
        .createQueryBuilder()
        .update(Estoque)
        .set({
          quantidadeReservada: () =>
            `quantidade_reservada + ${item.quantidade}`,
        })
        .where('produto_id = :produtoId', { produtoId: item.produtoId })
        .execute();

      this.logger.log(
        `Reservado: Produto ${item.produtoId} | +${item.quantidade}`,
      );
    }
  }

  /**
   * Confirma a saída definitiva do estoque quando uma venda é aprovada.
   * Decrementa `quantidade` E `quantidadeReservada` simultaneamente.
   *
   * @param itens   Lista de itens com saída confirmada
   * @param manager EntityManager opcional — use dentro de uma transação
   */
  async confirmarSaida(
    itens: ItemEstoque[],
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.log(`Confirmando saída de ${itens.length} item(s) do estoque`);
    const repo = this.repo(manager);

    for (const item of itens) {
      await repo
        .createQueryBuilder()
        .update(Estoque)
        .set({
          quantidade: () => `quantidade - ${item.quantidade}`,
          quantidadeReservada: () =>
            `quantidade_reservada - ${item.quantidade}`,
        })
        .where('produto_id = :produtoId', { produtoId: item.produtoId })
        .execute();

      this.logger.log(
        `Saída confirmada: Produto ${item.produtoId} | -${item.quantidade}`,
      );
    }
  }

  /**
   * Cancela uma reserva de estoque (decrementa apenas `quantidadeReservada`).
   * Usado quando uma venda em status ORÇAMENTO é cancelada ou excluída.
   *
   * @param itens   Lista de itens a ter reserva cancelada
   * @param manager EntityManager opcional — use dentro de uma transação
   */
  async cancelarReserva(
    itens: ItemEstoque[],
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.log(`Cancelando reserva de ${itens.length} item(s)`);
    const repo = this.repo(manager);

    for (const item of itens) {
      await repo
        .createQueryBuilder()
        .update(Estoque)
        .set({
          quantidadeReservada: () =>
            `quantidade_reservada - ${item.quantidade}`,
        })
        .where('produto_id = :produtoId', { produtoId: item.produtoId })
        .execute();

      this.logger.log(
        `Reserva cancelada: Produto ${item.produtoId} | -${item.quantidade}`,
      );
    }
  }

  /**
   * Devolve produtos ao estoque quando uma venda aprovada é cancelada.
   * Incrementa `quantidade` (a reserva já foi consumida na aprovação).
   *
   * @param itens   Lista de itens a devolver
   * @param manager EntityManager opcional — use dentro de uma transação
   */
  async devolverEstoque(
    itens: ItemEstoque[],
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.log(
      `Devolvendo estoque de ${itens.length} item(s) por cancelamento`,
    );
    const repo = this.repo(manager);

    for (const item of itens) {
      await repo
        .createQueryBuilder()
        .update(Estoque)
        .set({
          quantidade: () => `quantidade + ${item.quantidade}`,
        })
        .where('produto_id = :produtoId', { produtoId: item.produtoId })
        .execute();

      this.logger.log(
        `Devolvido: Produto ${item.produtoId} | +${item.quantidade}`,
      );
    }
  }

  /**
   * Ajusta o estoque manualmente para um valor absoluto (inventário/acerto).
   * Substitui a quantidade atual pelo valor informado.
   *
   * ATENÇÃO: Não cancela reservas existentes. Use com cuidado e
   * registre uma movimentação manual após este ajuste.
   *
   * @param dados   Dados do ajuste
   * @param manager EntityManager opcional — use dentro de uma transação
   */
  async ajustarEstoque(
    dados: {
      produtoId: string;
      quantidade: number;
      motivo: string;
      usuarioId: string;
    },
    manager?: EntityManager,
  ): Promise<Estoque> {
    this.logger.warn(
      `Ajuste manual de estoque — Produto: ${dados.produtoId}, Nova qtd: ${dados.quantidade}, Motivo: ${dados.motivo}`,
    );

    const repo = this.repo(manager);
    const produtoRepo = manager
      ? manager.getRepository(Produto)
      : this.produtoRepository;

    const produto = await produtoRepo.findOne({
      where: { id: dados.produtoId },
    });
    if (!produto) {
      throw new NotFoundException(
        `Produto com ID ${dados.produtoId} não encontrado`,
      );
    }

    let estoque = await repo.findOne({
      where: { produto: { id: dados.produtoId } },
    });

    if (!estoque) {
      estoque = repo.create({
        produto,
        quantidade: 0,
        quantidadeReservada: 0,
        custoMedio: 0,
      });
    }

    estoque.quantidade = dados.quantidade;

    const saved = await repo.save(estoque);
    this.logger.log(
      `Ajuste concluído — Saldo ajustado para: ${saved.quantidade}`,
    );
    return saved;
  }
}
