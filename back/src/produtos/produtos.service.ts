import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from './entities/produto.entity';
import { CreateProdutoDto } from './dto/create-produto.dto';

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private readonly repo: Repository<Produto>,
  ) { }

  async create(createProdutoDto: CreateProdutoDto) {
    // O repositório agora vai entender que 'categoria_id' preenche a coluna que criamos acima
    const novoProduto = this.repo.create(createProdutoDto);
    return await this.repo.save(novoProduto);
  }

  async findAll() {
    return await this.repo.find({
      relations: ['categoria', 'estoque'], // Adicione 'estoque' aqui
      order: { nome: 'ASC' }
    });
  }

  async findOne(id: string) {
    const produto = await this.repo.findOne({ where: { id }, relations: ['categoria', 'estoque'], });
    if (!produto) throw new NotFoundException('Produto não encontrado');
    return produto;
  }

  async update(id: string, data: any) {
    // Se o codigo_sku vier como string vazia, transforma em null
    if (data.codigo_sku === "") {
      data.codigo_sku = null;
    }
    const produto = await this.findOne(id);
    this.repo.merge(produto, data);
    return await this.repo.save(produto);
  }

  async remove(id: string) {
    const produto = await this.findOne(id);
    return await this.repo.remove(produto);
  }

  async removeAll() {
    // O clear() é o comando mais eficiente para esvaziar a tabela
    return await this.repo.clear();
  }

  // Função que gera o JSON para a Tabela de Preços (Visão Cruzada)
  async getTabelaPrecos(categoriaId: number) {
    const produtos = await this.repo.find({
      where: { categoria: { id: categoriaId }, ativo: true },
      order: { comprimento_mt: 'ASC', diametro_min: 'ASC' },
    });

    const colunasSet = new Set<string>();
    const matriz = {};

    produtos.forEach((p) => {
      const bitolaStr = `${p.diametro_min} a ${p.diametro_max}`;
      const compStr = `${p.comprimento_mt}M`;

      colunasSet.add(bitolaStr);

      if (!matriz[compStr]) matriz[compStr] = {};

      matriz[compStr][bitolaStr] = {
        preco: p.preco_venda_base,
        peso: p.peso_unitario_kg,
        id: p.id
      };
    });

    return {
      bitolas: Array.from(colunasSet).sort((a, b) => parseInt(a) - parseInt(b)),
      dados: matriz
    };
  }

  async getDadosParaRelatorio() {
    const produtos = await this.repo.find({
      where: { ativo: true },
      relations: ['categoria'],
      order: { comprimento_mt: 'ASC', diametro_min: 'ASC' }
    });

    const relatorio = {
      postes: {} as any,
      pecas: {} as any,
      ripas: [] as Produto[],
      bitolas: new Set<string>()
    };

    produtos.forEach(p => {
      const catNome = p.categoria?.nome?.toUpperCase() || 'OUTROS';
      const bitolaStr = `${p.diametro_min} a ${p.diametro_max}`;
      const compStr = `${Number(p.comprimento_mt).toFixed(1).replace('.', ',')}M`;

      if (catNome === 'POSTES' || catNome === 'PEÇAS') {
        relatorio.bitolas.add(bitolaStr);
        const alvo = catNome === 'POSTES' ? relatorio.postes : relatorio.pecas;

        if (!alvo[compStr]) alvo[compStr] = {};
        alvo[compStr][bitolaStr] = {
          peso: p.peso_unitario_kg,
          preco: p.preco_venda_base
        };
      } else if (catNome === 'RIPA' || catNome === 'RÉGUAS' || catNome === 'RIPAS') {
        relatorio.ripas.push(p);
      }
    });

    return {
      ...relatorio,
      bitolas: Array.from(relatorio.bitolas).sort((a, b) => parseInt(a) - parseInt(b))
    };
  }

  async findMedidas() {
    return await this.repo.find({
      select: {
        id: true,
        nome: true,
        comprimento_mt: true,
        diametro_min: true,
        diametro_max: true,
        peso_unitario_kg: true,
        unidade_comercial: true,
        ativo: true,
      },
      where: { ativo: true },
      order: { nome: 'ASC' },
    });
  }
}