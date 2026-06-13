import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caixa } from './entities/caixa.entity';
import { CreateCaixaDto } from './dto/create-caixa.dto';

@Injectable()
export class CaixaService {
  constructor(
    @InjectRepository(Caixa)
    private readonly repository: Repository<Caixa>,
  ) {}

  async create(createDto: CreateCaixaDto): Promise<Caixa> {
    const caixa = this.repository.create(createDto);
    return await this.repository.save(caixa);
  }

  async findAll(): Promise<Caixa[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<Caixa> {
    const caixa = await this.repository.findOne({ where: { id } });
    if (!caixa) throw new NotFoundException(`Caixa ${id} não encontrado`);
    return caixa;
  }

  async updateSaldo(id: string, novoSaldo: number): Promise<Caixa> {
    const caixa = await this.findOne(id);
    caixa.saldoAtual = novoSaldo;
    caixa.ultimaAtualizacao = new Date();
    return await this.repository.save(caixa);
  }
}