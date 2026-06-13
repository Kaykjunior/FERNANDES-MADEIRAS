import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly repo: Repository<Categoria>,
  ) {}

  async create(dto: CreateCategoriaDto): Promise<Categoria> {
    const categoria = this.repo.create(dto);
    return await this.repo.save(categoria);
  }

  async findAll(): Promise<Categoria[]> {
    return await this.repo.find({
      order: { nome: 'ASC' },
      relations: ['produtos'], // Opcional: traz os produtos vinculados
    });
  }

  async findOne(id: number): Promise<Categoria> {
    const categoria = await this.repo.findOne({ where: { id } });
    if (!categoria) {
      throw new NotFoundException(`Categoria com ID ${id} não encontrada`);
    }
    return categoria;
  }

  async update(id: number, dto: Partial<CreateCategoriaDto>): Promise<Categoria> {
    const categoria = await this.findOne(id);
    this.repo.merge(categoria, dto);
    return await this.repo.save(categoria);
  }

  async remove(id: number): Promise<void> {
    const categoria = await this.findOne(id);
    await this.repo.remove(categoria);
  }
}