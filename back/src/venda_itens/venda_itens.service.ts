import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendaItem } from './entities/venda_iten.entity';
import { CreateVendaItemDto } from './dto/create-venda_iten.dto';
import { UpdateVendaItemDto } from './dto/update-venda_iten.dto';

@Injectable()
export class VendaItensService {
  constructor(
    @InjectRepository(VendaItem)
    private vendaItemRepository: Repository<VendaItem>,
  ) {}

  async create(createVendaItemDto: CreateVendaItemDto): Promise<VendaItem> {
    const vendaItem = this.vendaItemRepository.create(createVendaItemDto);
    return this.vendaItemRepository.save(vendaItem);
  }

  async findAll(): Promise<VendaItem[]> {
    return this.vendaItemRepository.find({
      relations: ['produto', 'venda', 'lote'],
    });
  }

  async findOne(id: string): Promise<VendaItem> {
    const vendaItem = await this.vendaItemRepository.findOne({
      where: { id },
      relations: ['produto', 'venda', 'lote'],
    });
    
    if (!vendaItem) {
      throw new NotFoundException(`VendaItem com ID ${id} não encontrado`);
    }
    
    return vendaItem;
  }

  async update(id: string, updateVendaItemDto: UpdateVendaItemDto): Promise<VendaItem> {
    const vendaItem = await this.vendaItemRepository.preload({
      id,
      ...updateVendaItemDto,
    });
    
    if (!vendaItem) {
      throw new NotFoundException(`VendaItem com ID ${id} não encontrado`);
    }
    
    return this.vendaItemRepository.save(vendaItem);
  }

  async remove(id: string): Promise<void> {
    const vendaItem = await this.findOne(id);
    await this.vendaItemRepository.remove(vendaItem);
  }
}