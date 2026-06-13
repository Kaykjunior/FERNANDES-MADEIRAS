import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { MovimentacaoEstoque, TipoMovimentacao } from './entities/movimentacoes_estoque.entity';
import { CreateMovimentacoesEstoqueDto } from './dto/create-movimentacoes_estoque.dto';

@Injectable()
export class MovimentacoesEstoqueService {
  constructor(
    @InjectRepository(MovimentacaoEstoque)
    private readonly movimentacaoEstoqueRepository: Repository<MovimentacaoEstoque>,
  ) {}

  async create(createMovimentacoesEstoqueDto: CreateMovimentacoesEstoqueDto): Promise<MovimentacaoEstoque> {
    const movimentacao = this.movimentacaoEstoqueRepository.create({
      ...createMovimentacoesEstoqueDto,
      quantidade: Math.abs(createMovimentacoesEstoqueDto.quantidade),
    });
    
    return await this.movimentacaoEstoqueRepository.save(movimentacao);
  }

  async findAll(filters?: {
    tipo?: TipoMovimentacao;
    produtoId?: string;
    dataInicio?: Date;
    dataFim?: Date;
    motivo?: string;
    usuarioId?: string;
  }): Promise<MovimentacaoEstoque[]> {
    const where: any = {};

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters?.produtoId) {
      where.produtoId = filters.produtoId;
    }

    if (filters?.dataInicio && filters?.dataFim) {
      where.createdAt = Between(filters.dataInicio, filters.dataFim);
    }

    if (filters?.motivo) {
      where.motivo = Like(`%${filters.motivo}%`);
    }

    if (filters?.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    return await this.movimentacaoEstoqueRepository.find({
      where,
      relations: ['produto', 'usuario'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: string): Promise<MovimentacaoEstoque> {
    const movimentacao = await this.movimentacaoEstoqueRepository.findOne({
      where: { id },
      relations: ['produto', 'usuario'],
    });
    
    if (!movimentacao) {
      throw new Error('Movimentação não encontrada');
    }
    
    return movimentacao;
  }

  async getResumoMovimentacoes(periodo: 'HOJE' | '7_DIAS' | '30_DIAS' = '30_DIAS'): Promise<any> {
    const dataInicio = new Date();
    
    switch (periodo) {
      case 'HOJE':
        dataInicio.setHours(0, 0, 0, 0);
        break;
      case '7_DIAS':
        dataInicio.setDate(dataInicio.getDate() - 7);
        break;
      case '30_DIAS':
        dataInicio.setDate(dataInicio.getDate() - 30);
        break;
    }

    const dataFim = new Date();

    // Total de entradas
    const entradas = await this.movimentacaoEstoqueRepository
      .createQueryBuilder('mov')
      .select('SUM(mov.quantidade)', 'total')
      .where('mov.tipo = :tipo', { tipo: TipoMovimentacao.ENTRADA })
      .andWhere('mov.createdAt BETWEEN :inicio AND :fim', { inicio: dataInicio, fim: dataFim })
      .getRawOne();

    // Total de saídas
    const saidas = await this.movimentacaoEstoqueRepository
      .createQueryBuilder('mov')
      .select('SUM(mov.quantidade)', 'total')
      .where('mov.tipo = :tipo', { tipo: TipoMovimentacao.SAIDA })
      .andWhere('mov.createdAt BETWEEN :inicio AND :fim', { inicio: dataInicio, fim: dataFim })
      .getRawOne();

    // Movimentações recentes
    const recentes = await this.movimentacaoEstoqueRepository.find({
      where: {
        createdAt: Between(dataInicio, dataFim),
      },
      relations: ['produto'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalEntradas: parseFloat(entradas?.total || '0'),
      totalSaidas: Math.abs(parseFloat(saidas?.total || '0')),
      saldoPeriodo: (parseFloat(entradas?.total || '0') - parseFloat(saidas?.total || '0')),
      movimentacoesRecentes: recentes,
    };
  }
}