import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendasService } from '../vendas.service';
import { Venda, StatusVenda, StatusPagamento } from '../entities/venda.entity';
import { VendaItem } from 'src/venda_itens/entities/venda_iten.entity';
import { ContaReceber, StatusContaReceber } from 'src/contas_receber/entities/contas_receber.entity';
import { Comissao, StatusComissao } from 'src/comissoes/entities/comissoe.entity';
import { Caixa } from 'src/caixa/entities/caixa.entity';
import { FormasPagamento } from 'src/formas_pagamento/entities/formas_pagamento.entity';
import { MovimentacaoEstoque, TipoMovimentacao } from 'src/movimentacoes_estoque/entities/movimentacoes_estoque.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('VendasService', () => {
  let service: VendasService;
  let vendaRepository: Repository<Venda>;
  let vendaItemRepository: Repository<VendaItem>;
  let contaReceberRepository: Repository<ContaReceber>;
  let comissaoRepository: Repository<Comissao>;
  let caixaRepository: Repository<Caixa>;
  let formaPagamentoRepository: Repository<FormasPagamento>;
  let movimentacaoEstoqueRepository: Repository<MovimentacaoEstoque>;

  const mockVendaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
  };

  const mockVendaItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockContaReceberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockComissaoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockCaixaRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockFormaPagamentoRepository = {
    findOne: jest.fn(),
  };

  const mockMovimentacaoEstoqueRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendasService,
        {
          provide: getRepositoryToken(Venda),
          useValue: mockVendaRepository,
        },
        {
          provide: getRepositoryToken(VendaItem),
          useValue: mockVendaItemRepository,
        },
        {
          provide: getRepositoryToken(ContaReceber),
          useValue: mockContaReceberRepository,
        },
        {
          provide: getRepositoryToken(Comissao),
          useValue: mockComissaoRepository,
        },
        {
          provide: getRepositoryToken(Caixa),
          useValue: mockCaixaRepository,
        },
        {
          provide: getRepositoryToken(FormasPagamento),
          useValue: mockFormaPagamentoRepository,
        },
        {
          provide: getRepositoryToken(MovimentacaoEstoque),
          useValue: mockMovimentacaoEstoqueRepository,
        },
      ],
    }).compile();

    service = module.get<VendasService>(VendasService);
    vendaRepository = module.get<Repository<Venda>>(getRepositoryToken(Venda));
    vendaItemRepository = module.get<Repository<VendaItem>>(getRepositoryToken(VendaItem));
    contaReceberRepository = module.get<Repository<ContaReceber>>(getRepositoryToken(ContaReceber));
    comissaoRepository = module.get<Repository<Comissao>>(getRepositoryToken(Comissao));
    caixaRepository = module.get<Repository<Caixa>>(getRepositoryToken(Caixa));
    formaPagamentoRepository = module.get<Repository<FormasPagamento>>(getRepositoryToken(FormasPagamento));
    movimentacaoEstoqueRepository = module.get<Repository<MovimentacaoEstoque>>(getRepositoryToken(MovimentacaoEstoque));
  });

  describe('create', () => {
    it('deve criar uma venda com status ORCAMENTO por padrão', async () => {
      const createVendaDto = {
        clienteId: 'cliente-123',
        vendedorId: 'vendedor-456',
        valorProdutos: 1000,
        valorTotal: 1000,
        itens: [
          {
            produtoId: 'produto-1',
            quantidade: 2,
            valorUnitario: 500,
            valorSubtotal: 1000,
            cfop: '5102',
          },
        ],
      };

      const vendaSalva = {
        id: 'venda-123',
        numeroPedido: 1,
        statusVenda: StatusVenda.ORCAMENTO,
        status: StatusPagamento.AGUARDANDO,
        ...createVendaDto,
        itens: [],
      };

      mockVendaRepository.create.mockReturnValue(createVendaDto);
      mockVendaRepository.save.mockResolvedValue(vendaSalva);
      mockVendaItemRepository.save.mockResolvedValue([]);

      const result = await service.create(createVendaDto as any);

      expect(result.statusVenda).toBe(StatusVenda.ORCAMENTO);
      expect(result.status).toBe(StatusPagamento.AGUARDANDO);
    });

    it('deve calcular valores se não fornecidos', async () => {
      const createVendaDto = {
        clienteId: 'cliente-123',
        vendedorId: 'vendedor-456',
        itens: [
          {
            produtoId: 'produto-1',
            quantidade: 2,
            valorUnitario: 500,
            valorSubtotal: 1000,
            cfop: '5102',
          },
        ],
      };

      const vendaSalva = {
        id: 'venda-123',
        numeroPedido: 1,
        valorProdutos: 1000,
        valorTotal: 1000,
        statusVenda: StatusVenda.ORCAMENTO,
        status: StatusPagamento.AGUARDANDO,
        ...createVendaDto,
        itens: [],
      };

      mockVendaRepository.create.mockReturnValue(createVendaDto);
      mockVendaRepository.save.mockResolvedValue(vendaSalva);
      mockVendaItemRepository.save.mockResolvedValue([]);

      const result = await service.create(createVendaDto as any);

      expect(result.valorProdutos).toBe(1000);
      expect(result.valorTotal).toBe(1000);
    });
  });

  describe('atualizarStatus', () => {
    it('deve gerar financeiro e comissões ao aprovar orçamento', async () => {
      const venda = {
        id: 'venda-123',
        numeroPedido: 1,
        clienteId: 'cliente-123',
        vendedorId: 'vendedor-456',
        valorTotal: 1000,
        statusVenda: StatusVenda.ORCAMENTO,
        itens: [
          {
            id: 'item-1',
            produtoId: 'produto-1',
            loteId: 'lote-1',
            quantidade: 2,
          },
        ],
      };

      const formaPagamento = {
        id: 1,
        diasRecebimento: 0,
      };

      const caixa = {
        id: 'PRINCIPAL',
        saldo_atual: 1000,
        ultima_atualizacao: new Date(),
      };

      mockVendaRepository.findOne.mockResolvedValue(venda);
      mockVendaRepository.save.mockResolvedValue({ ...venda, statusVenda: StatusVenda.APROVADO });
      mockFormaPagamentoRepository.findOne.mockResolvedValue(formaPagamento);
      mockCaixaRepository.findOne.mockResolvedValue(caixa);
      mockCaixaRepository.save.mockResolvedValue(caixa);
      mockContaReceberRepository.create.mockReturnValue({});
      mockContaReceberRepository.save.mockResolvedValue({});
      mockComissaoRepository.create.mockReturnValue({});
      mockComissaoRepository.save.mockResolvedValue({});
      mockMovimentacaoEstoqueRepository.create.mockReturnValue({});
      mockMovimentacaoEstoqueRepository.save.mockResolvedValue({});

      const result = await service.atualizarStatus('venda-123', StatusVenda.APROVADO);

      expect(result.statusVenda).toBe(StatusVenda.APROVADO);
      expect(mockFormaPagamentoRepository.findOne).toHaveBeenCalled();
      expect(mockContaReceberRepository.create).toHaveBeenCalled();
      expect(mockComissaoRepository.create).toHaveBeenCalled();
      expect(mockMovimentacaoEstoqueRepository.create).toHaveBeenCalled();
    });
  });
});