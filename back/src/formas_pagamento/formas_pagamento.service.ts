import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormasPagamento } from './entities/formas_pagamento.entity';
import { CreateFormasPagamentoDto } from './dto/create-formas_pagamento.dto';
import { UpdateFormasPagamentoDto } from './dto/update-formas_pagamento.dto';

@Injectable()
export class FormasPagamentoService {
  constructor(
    @InjectRepository(FormasPagamento)
    private readonly repository: Repository<FormasPagamento>,
  ) {}

  async create(createDto: CreateFormasPagamentoDto): Promise<FormasPagamento> {
    const novo = this.repository.create(createDto);
    return await this.repository.save(novo);
  }

  async findAll(): Promise<FormasPagamento[]> {
    return await this.repository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<FormasPagamento> {
    const forma = await this.repository.findOne({ where: { id } });
    if (!forma) throw new NotFoundException(`Forma de pagamento #${id} não encontrada`);
    return forma;
  }

  async update(id: number, updateDto: UpdateFormasPagamentoDto): Promise<FormasPagamento> {
    const forma = await this.repository.preload({ id, ...updateDto });
    if (!forma) throw new NotFoundException(`Forma de pagamento #${id} não encontrada`);
    return await this.repository.save(forma);
  }

  async remove(id: number): Promise<void> {
    const forma = await this.findOne(id);
    await this.repository.remove(forma);
  }
}