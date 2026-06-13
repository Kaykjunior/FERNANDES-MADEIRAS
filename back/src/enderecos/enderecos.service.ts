import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, IsNull, Not } from 'typeorm';
import { Endereco, TipoEndereco } from './entities/endereco.entity';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';
import { FilterEnderecoDto } from './dto/filter-endereco.dto';
import { Entidade } from '../entidades/entities/entidade.entity';

@Injectable()
export class EnderecosService {
  constructor(
    @InjectRepository(Endereco)
    private enderecosRepository: Repository<Endereco>,
    @InjectRepository(Entidade)
    private entidadesRepository: Repository<Entidade>
  ) { }

  async create(createEnderecoDto: CreateEnderecoDto): Promise<Endereco> {
    // Verifica se entidade existe
    const entidade = await this.entidadesRepository.findOne({
      where: { id: createEnderecoDto.entidade_id }
    });

    if (!entidade) {
      throw new NotFoundException('Entidade não encontrada');
    }

    // Se for marcado como padrão, desmarca outros padrões da mesma entidade
    if (createEnderecoDto.padrao) {
      await this.unsetPadraoEnderecos(createEnderecoDto.entidade_id);
    }

    const endereco = this.enderecosRepository.create({
      entidadeId: createEnderecoDto.entidade_id,
      tipoEndereco: createEnderecoDto.tipo_endereco,
      logradouro: createEnderecoDto.logradouro,
      numero: createEnderecoDto.numero,
      complemento: createEnderecoDto.complemento,
      bairro: createEnderecoDto.bairro,
      cidade: createEnderecoDto.cidade,
      estado: createEnderecoDto.estado.toUpperCase(),
      cep: createEnderecoDto.cep,
      pais: createEnderecoDto.pais || 'Brasil',
      padrao: createEnderecoDto.padrao || false,
      observacoes: createEnderecoDto.observacoes
    });

    return await this.enderecosRepository.save(endereco);
  }

  async findAll(filterDto: FilterEnderecoDto): Promise<{
    data: Endereco[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { tipo_endereco, cidade, estado, cep, padrao, page = 1, limit = 10 } = filterDto;

    const where: FindOptionsWhere<Endereco> = {};

    if (tipo_endereco) where.tipoEndereco = tipo_endereco;
    if (cidade) where.cidade = ILike(`%${cidade}%`);
    if (estado) where.estado = estado.toUpperCase();
    if (cep) where.cep = ILike(`%${cep}%`);
    if (padrao !== undefined) where.padrao = padrao;
    where.deletedAt = IsNull();

    const skip = (page - 1) * limit;

    const [data, total] = await this.enderecosRepository.findAndCount({
      where,
      relations: ['entidade'],
      order: { padrao: 'DESC', logradouro: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<Endereco> {
    const endereco = await this.enderecosRepository.findOne({
      where: { id },
      relations: ['entidade']
    });

    if (!endereco) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }

    return endereco;
  }

  async findByEntidade(entidadeId: string): Promise<Endereco[]> {
    const entidade = await this.entidadesRepository.findOne({
      where: { id: entidadeId }
    });

    if (!entidade) {
      throw new NotFoundException('Entidade não encontrada');
    }

    return await this.enderecosRepository.find({
      where: {
        entidadeId,
        deletedAt: IsNull()
      },
      order: { padrao: 'DESC', tipoEndereco: 'ASC' }
    });
  }

  async update(id: string, updateEnderecoDto: UpdateEnderecoDto): Promise<Endereco> {
    const endereco = await this.findOne(id);

    // Se for marcado como padrão, desmarca outros padrões
    if (updateEnderecoDto.padrao === true) {
      await this.unsetPadraoEnderecos(endereco.entidadeId);
    }

    // Atualizar campos
    if (updateEnderecoDto.tipo_endereco !== undefined) {
      endereco.tipoEndereco = updateEnderecoDto.tipo_endereco;
    }
    if (updateEnderecoDto.logradouro !== undefined) {
      endereco.logradouro = updateEnderecoDto.logradouro;
    }
    if (updateEnderecoDto.numero !== undefined) {
      endereco.numero = updateEnderecoDto.numero;
    }
    if (updateEnderecoDto.complemento !== undefined) {
      endereco.complemento = updateEnderecoDto.complemento;
    }
    if (updateEnderecoDto.bairro !== undefined) {
      endereco.bairro = updateEnderecoDto.bairro;
    }
    if (updateEnderecoDto.cidade !== undefined) {
      endereco.cidade = updateEnderecoDto.cidade;
    }
    if (updateEnderecoDto.estado !== undefined) {
      endereco.estado = updateEnderecoDto.estado.toUpperCase();
    }
    if (updateEnderecoDto.cep !== undefined) {
      endereco.cep = updateEnderecoDto.cep;
    }
    if (updateEnderecoDto.pais !== undefined) {
      endereco.pais = updateEnderecoDto.pais;
    }
    if (updateEnderecoDto.padrao !== undefined) {
      endereco.padrao = updateEnderecoDto.padrao;
    }
    if (updateEnderecoDto.observacoes !== undefined) {
      endereco.observacoes = updateEnderecoDto.observacoes;
    }

    return await this.enderecosRepository.save(endereco);
  }

  async remove(id: string): Promise<void> {
    const result = await this.enderecosRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }
  }

  async restore(id: string): Promise<Endereco> {
    const result = await this.enderecosRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado ou não está excluído`);
    }

    return this.findOne(id);
  }

  async setAsPadrao(id: string): Promise<Endereco> {
    const endereco = await this.findOne(id);

    // Desmarca todos os outros endereços padrão da mesma entidade
    await this.unsetPadraoEnderecos(endereco.entidadeId);

    // Marca este como padrão
    endereco.padrao = true;

    return await this.enderecosRepository.save(endereco);
  }

  async findByCep(cep: string): Promise<Endereco[]> {
    return await this.enderecosRepository.find({
      where: {
        cep: ILike(`%${cep}%`),
        deletedAt: IsNull()
      },
      relations: ['entidade'],
      take: 20
    });
  }

  async findByEstado(estado: string): Promise<Endereco[]> {
    return await this.enderecosRepository.find({
      where: {
        estado: estado.toUpperCase(),
        deletedAt: IsNull()
      },
      relations: ['entidade'],
      take: 50
    });
  }

  private async unsetPadraoEnderecos(entidadeId: string): Promise<void> {
    await this.enderecosRepository.update(
      { entidadeId, padrao: true },
      { padrao: false }
    );
  }

  async findEnderecoPreferencial(entidadeId: string): Promise<Endereco | null> {
    const enderecos = await this.enderecosRepository.find({
      where: {
        entidadeId,
        deletedAt: IsNull()
      },
      order: {
        // Primeiro ordena por tipo na ordem de preferência
        tipoEndereco: 'ASC',
        // Depois por padrão (se houver múltiplos do mesmo tipo)
        padrao: 'DESC',
        // Por último por data de criação
        createdAt: 'ASC'
      }
    });

    if (enderecos.length === 0) {
      return null;
    }

    // Define a ordem de prioridade
    const prioridade = [
      'ENTREGA',
      'PRINCIPAL',
      'COMERCIAL',
      'COBRANCA',
      'RESIDENCIAL',
      'OUTROS'
    ];

    // Encontra o primeiro endereço na ordem de prioridade
    for (const tipo of prioridade) {
      const endereco = enderecos.find(e => e.tipoEndereco === tipo);
      if (endereco) {
        return endereco;
      }
    }

    // Se não encontrar nenhum dos tipos acima (improvável), retorna o primeiro
    return enderecos[0];
  }


}