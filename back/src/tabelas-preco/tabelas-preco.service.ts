import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TabelaPreco } from './entities/tabela preco.entity';
import { TabelaPrecoItem } from './entities/tabela preco item.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { CreateTabelaPrecoDto } from './dto/create tabela preco.dto';
import { UpdateTabelaPrecoDto } from './dto/update tabela preco.dto';
import { SetItensTabelaPrecoDto } from './dto/set-itens-tabela-preco.dto';

@Injectable()
export class TabelasPrecoService {
  constructor(
    @InjectRepository(TabelaPreco)
    private readonly repo: Repository<TabelaPreco>,
    @InjectRepository(TabelaPrecoItem)
    private readonly itemRepo: Repository<TabelaPrecoItem>,
    @InjectRepository(Produto)
    private readonly produtoRepo: Repository<Produto>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTabelaPrecoDto) {
    const { itens, ...dadosTabela } = dto;

    const tabela = this.repo.create(dadosTabela);

    if (dadosTabela.padrao) {
      await this.limparPadraoAtual();
    }

    const salva = await this.repo.save(tabela);

    if (itens && itens.length > 0) {
      const produtoIds = itens.map((i) => i.produtoId).filter((id): id is string => !!id);
      await this.validarProdutos(produtoIds);

      const novosItens = itens.map((item) =>
        this.itemRepo.create({
          tabelaPrecoId: salva.id,
          produtoId: item.produtoId,
          preco: item.preco,
          ativo: item.ativo ?? true,
        }),
      );
      await this.itemRepo.save(novosItens);
    }

    // CORREÇÃO: O '!' garante que o ID foi gerado após o save
    return this.findOne(salva.id!);
  }

  async findAll() {
    return await this.repo.find({
      order: { nome: 'ASC' },
    });
  }

  async findOne(id: string) {
    const tabela = await this.repo.findOne({
      where: { id },
      relations: ['itens', 'itens.produto', 'itens.produto.categoria'],
    });
    if (!tabela) throw new NotFoundException('Tabela de preços não encontrada');
    return tabela;
  }

  async update(id: string, dto: UpdateTabelaPrecoDto) {
    const tabela = await this.findOne(id);

    if (dto.padrao === true) {
      await this.limparPadraoAtual();
    }

    this.repo.merge(tabela, dto);
    await this.repo.save(tabela);
    return this.findOne(id);
  }

  async remove(id: string) {
    const tabela = await this.findOne(id);
    return await this.repo.remove(tabela);
  }

  // Substitui (faz upsert) todos os itens (produto + preço) de uma tabela
  async setItens(id: string, dto: SetItensTabelaPrecoDto) {
    const tabela = await this.findOne(id);
    
    const itensDto = dto.itens ?? [];
    
    const produtoIds = itensDto.map((i) => i.produtoId).filter((id): id is string => !!id);
    await this.validarProdutos(produtoIds);

    return await this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(TabelaPrecoItem);

      // Remove itens existentes que não estão mais na nova lista
      const idsEnviados = new Set(produtoIds);
      const itensAtuais = await itemRepo.find({ where: { tabelaPrecoId: id } });
      
      // CORREÇÃO: Filtra garantindo que i.produtoId existe antes de checar no Set
      const paraRemover = itensAtuais.filter((i) => !i.produtoId || !idsEnviados.has(i.produtoId));
      if (paraRemover.length > 0) {
        await itemRepo.remove(paraRemover);
      }

      // Upsert dos itens enviados
      for (const itemDto of itensDto) {
        const existente = itensAtuais.find((i) => i.produtoId === itemDto.produtoId);
        if (existente) {
          existente.preco = itemDto.preco;
          existente.ativo = itemDto.ativo ?? true;
          // CORREÇÃO: Corrigido de 'existing' para 'existente'
          await itemRepo.save(existente);
        } else {
          const novo = itemRepo.create({
            tabelaPrecoId: id,
            produtoId: itemDto.produtoId,
            preco: itemDto.preco,
            ativo: itemDto.ativo ?? true,
          });
          await itemRepo.save(novo);
        }
      }

      return tabela;
    }).then(() => this.findOne(id));
  }

  // Adiciona ou atualiza o preço de um único produto na tabela
  async upsertItem(tabelaId: string, produtoId: string, preco: number, ativo = true) {
    await this.findOne(tabelaId);
    await this.validarProdutos([produtoId]);

    let item = await this.itemRepo.findOne({
      where: { tabelaPrecoId: tabelaId, produtoId },
    });

    if (item) {
      item.preco = preco;
      item.ativo = ativo;
    } else {
      item = this.itemRepo.create({ tabelaPrecoId: tabelaId, produtoId, preco, ativo });
    }

    return await this.itemRepo.save(item);
  }

  // Remove um produto de uma tabela de preços
  async removeItem(tabelaId: string, produtoId: string) {
    const item = await this.itemRepo.findOne({
      where: { tabelaPrecoId: tabelaId, produtoId },
    });
    if (!item) throw new NotFoundException('Produto não encontrado nesta tabela de preços');
    return await this.itemRepo.remove(item);
  }

  /**
   * Retorna os produtos disponíveis em uma tabela de preços específica,
   * já com o preço daquela tabela aplicado em `preco_venda_base` e o
   * estoque incluído. Usado pelo frontend ao montar um pedido/venda.
   */
  async getProdutosPorTabela(tabelaId: string) {
    const tabela = await this.repo.findOne({ where: { id: tabelaId } });
    if (!tabela) throw new NotFoundException('Tabela de preços não encontrada');

    const itens = await this.itemRepo.find({
      where: { tabelaPrecoId: tabelaId, ativo: true },
      relations: ['produto', 'produto.categoria', 'produto.estoque'],
    });

    return itens
      // CORREÇÃO: Usando '=== true' limpamos o erro de boolean | undefined
      .filter((item): item is typeof item & { produto: NonNullable<typeof item.produto> } => 
        !!item.produto && item.produto.ativo === true
      )
      .map((item) => ({
        id: item.produto.id,
        nome: item.produto.nome,
        codigo_sku: item.produto.codigo_sku,
        categoria: item.produto.categoria,
        unidade_comercial: item.produto.unidade_comercial,
        estoque: item.produto.estoque,
        dimensao_ripa: item.produto.dimensao_ripa,
        comprimento_mt: item.produto.comprimento_mt,
        diametro_min: item.produto.diametro_min,
        diametro_max: item.produto.diametro_max,
        preco_venda_base: item.preco,
        tabelaPrecoItemId: item.id,
      }))
      .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''));
  }

  private async validarProdutos(produtoIds: string[]) {
    const unicos = Array.from(new Set(produtoIds));
    const encontrados = await this.produtoRepo.find({
      where: unicos.map((id) => ({ id })),
    });
    if (encontrados.length !== unicos.length) {
      const encontradosIds = new Set(encontrados.map((p) => p.id));
      const faltantes = unicos.filter((id) => !encontradosIds.has(id));
      throw new BadRequestException(
        `Produto(s) não encontrado(s): ${faltantes.join(', ')}`,
      );
    }
  }

  private async limparPadraoAtual() {
    await this.repo.update({ padrao: true }, { padrao: false });
  }
}