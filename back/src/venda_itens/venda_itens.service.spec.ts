import { Test, TestingModule } from '@nestjs/testing';
import { VendaItensService } from './venda_itens.service';

describe('VendaItensService', () => {
  let service: VendaItensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendaItensService],
    }).compile();

    service = module.get<VendaItensService>(VendaItensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
