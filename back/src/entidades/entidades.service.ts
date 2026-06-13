import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, IsNull, Not } from 'typeorm';
import { Entidade, TipoEntidade } from './entities/entidade.entity';
import { CreateEntidadeDto } from './dto/create-entidade.dto';
import { UpdateEntidadeDto } from './dto/update-entidade.dto';
import { FilterEntidadeDto } from './dto/filter-entidade.dto';

@Injectable()
export class EntidadesService {
  constructor(
    @InjectRepository(Entidade)
    private entidadesRepository: Repository<Entidade>
  ) {}

  async create(createEntidadeDto: CreateEntidadeDto): Promise<Entidade> {
    // Verifica se documento já existe
    const existing = await this.entidadesRepository.findOne({
      where: { documento: createEntidadeDto.documento }
    });

    if (existing) {
      throw new ConflictException('Documento já cadastrado');
    }

    // Validações adicionais
    this.validateDocument(createEntidadeDto.documento, createEntidadeDto.tipo_pessoa);

    // Converter snake_case do DTO para camelCase da entidade
    const entidade = this.entidadesRepository.create({
      tipoEntidade: createEntidadeDto.tipo_entidade,
      tipoPessoa: createEntidadeDto.tipo_pessoa,
      documento: createEntidadeDto.documento,
      rgIe: createEntidadeDto.rg_ie,
      indicadorIe: createEntidadeDto.indicador_ie,
      nomeRazaoSocial: createEntidadeDto.nome_razao_social,
      nomeFantasia: createEntidadeDto.nome_fantasia,
      email: createEntidadeDto.email,
      telefone: createEntidadeDto.telefone,
      celular: createEntidadeDto.celular,
      observacoes: createEntidadeDto.observacoes,
      regimeTributario: createEntidadeDto.regime_tributario
    });

    return await this.entidadesRepository.save(entidade);
  }

  async findAll(filterDto: FilterEntidadeDto): Promise<{
    data: Entidade[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { tipo_entidade, tipo_pessoa, documento, nome, somente_ativos, page = 1, limit = 10 } = filterDto;
    const where: FindOptionsWhere<Entidade>[] | FindOptionsWhere<Entidade> = [];

    // Criar condições de busca
    const conditions: FindOptionsWhere<Entidade> = {};
    
    // Converter DTO snake_case para entidade camelCase
    if (tipo_entidade) conditions.tipoEntidade = tipo_entidade;
    if (tipo_pessoa) conditions.tipoPessoa = tipo_pessoa;
    if (documento) conditions.documento = Like(`%${documento}%`);
    
    // Adicionar condição de apenas ativos se solicitado
    if (somente_ativos !== false) {
      conditions.deletedAt = IsNull();
    }

    // Se tiver nome, vamos buscar em múltiplos campos
    if (nome) {
      where.push(
        { ...conditions, nomeRazaoSocial: Like(`%${nome}%`) },
        { ...conditions, nomeFantasia: Like(`%${nome}%`) }
      );
    } else {
      where.push(conditions);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.entidadesRepository.findAndCount({
      where,
      order: { nomeRazaoSocial: 'ASC' },
      skip,
      take: limit,
      withDeleted: somente_ativos === false, // Incluir excluídos se não for apenas ativos
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<Entidade> {
    const entidade = await this.entidadesRepository.findOne({
      where: { id }
    });

    if (!entidade) {
      throw new NotFoundException(`Entidade com ID ${id} não encontrada`);
    }

    return entidade;
  }

  async findByDocument(documento: string): Promise<Entidade> {
    const entidade = await this.entidadesRepository.findOne({
      where: { documento }
    });

    if (!entidade) {
      throw new NotFoundException(`Entidade com documento ${documento} não encontrada`);
    }

    return entidade;
  }

  async update(id: string, updateEntidadeDto: UpdateEntidadeDto): Promise<Entidade> {
    const entidade = await this.findOne(id);

    // Se estiver atualizando o documento, verifica se não está em uso
    if (updateEntidadeDto.documento && updateEntidadeDto.documento !== entidade.documento) {
      const existing = await this.entidadesRepository.findOne({
        where: { documento: updateEntidadeDto.documento }
      });

      if (existing) {
        throw new ConflictException('Documento já está em uso por outra entidade');
      }

      // Valida novo documento
      this.validateDocument(
        updateEntidadeDto.documento, 
        updateEntidadeDto.tipo_pessoa || entidade.tipoPessoa
      );
    }

    // Atualizar apenas os campos que foram fornecidos
    if (updateEntidadeDto.tipo_entidade !== undefined) {
      entidade.tipoEntidade = updateEntidadeDto.tipo_entidade;
    }
    if (updateEntidadeDto.tipo_pessoa !== undefined) {
      entidade.tipoPessoa = updateEntidadeDto.tipo_pessoa;
    }
    if (updateEntidadeDto.documento !== undefined) {
      entidade.documento = updateEntidadeDto.documento;
    }
    if (updateEntidadeDto.rg_ie !== undefined) {
      entidade.rgIe = updateEntidadeDto.rg_ie;
    }
    if (updateEntidadeDto.indicador_ie !== undefined) {
      entidade.indicadorIe = updateEntidadeDto.indicador_ie;
    }
    if (updateEntidadeDto.nome_razao_social !== undefined) {
      entidade.nomeRazaoSocial = updateEntidadeDto.nome_razao_social;
    }
    if (updateEntidadeDto.nome_fantasia !== undefined) {
      entidade.nomeFantasia = updateEntidadeDto.nome_fantasia;
    }
    if (updateEntidadeDto.email !== undefined) {
      entidade.email = updateEntidadeDto.email;
    }
    if (updateEntidadeDto.telefone !== undefined) {
      entidade.telefone = updateEntidadeDto.telefone;
    }
    if (updateEntidadeDto.celular !== undefined) {
      entidade.celular = updateEntidadeDto.celular;
    }
    if (updateEntidadeDto.observacoes !== undefined) {
      entidade.observacoes = updateEntidadeDto.observacoes;
    }
    if (updateEntidadeDto.regime_tributario !== undefined) {
      entidade.regimeTributario = updateEntidadeDto.regime_tributario;
    }

    return await this.entidadesRepository.save(entidade);
  }

  async remove(id: string): Promise<void> {
    const result = await this.entidadesRepository.softDelete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Entidade com ID ${id} não encontrada`);
    }
  }

  async restore(id: string): Promise<Entidade> {
    const result = await this.entidadesRepository.restore(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Entidade com ID ${id} não encontrada ou não está excluída`);
    }

    return this.findOne(id);
  }

  async findByTipo(tipo: TipoEntidade): Promise<Entidade[]> {
    return await this.entidadesRepository.find({
      where: { 
        tipoEntidade: tipo,
        deletedAt: IsNull()
      },
      order: { nomeRazaoSocial: 'ASC' }
    });
  }

  private validateDocument(documento: string, tipo_pessoa: string): void {
    const cleanDoc = documento.replace(/\D/g, '');
    
    if (tipo_pessoa === 'F') { // Pessoa Física
      if (cleanDoc.length !== 11) {
        throw new BadRequestException('CPF deve ter 11 dígitos');
      }
      // Aqui você pode adicionar validação de CPF
      if (!this.isValidCPF(cleanDoc)) {
        throw new BadRequestException('CPF inválido');
      }
    } else { // Pessoa Jurídica
      if (cleanDoc.length !== 14) {
        throw new BadRequestException('CNPJ deve ter 14 dígitos');
      }
      // Aqui você pode adicionar validação de CNPJ
      if (!this.isValidCNPJ(cleanDoc)) {
        throw new BadRequestException('CNPJ inválido');
      }
    }
  }

  async searchByNome(nome: string): Promise<Entidade[]> {
    return await this.entidadesRepository.find({
      where: [
        { 
          nomeRazaoSocial: Like(`%${nome}%`), 
          deletedAt: IsNull() 
        },
        { 
          nomeFantasia: Like(`%${nome}%`), 
          deletedAt: IsNull() 
        }
      ],
      take: 10
    });
  }

  // Métodos auxiliares para validação de CPF/CNPJ
  private isValidCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let soma = 0;
    let resto;

    // Validação do primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }

  private isValidCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    // Validação do primeiro dígito verificador
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    // Validação do segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    
    return true;
  }

  // Método adicional para buscar todos (incluindo excluídos)
  async findAllWithDeleted(): Promise<Entidade[]> {
    return await this.entidadesRepository.find({
      withDeleted: true,
      order: { nomeRazaoSocial: 'ASC' }
    });
  }

  // Método para buscar apenas excluídos
  async findDeleted(): Promise<Entidade[]> {
    return await this.entidadesRepository.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      order: { deletedAt: 'DESC' }
    });
  }
}