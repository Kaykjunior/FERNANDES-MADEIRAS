import { Test, TestingModule } from '@nestjs/testing';
import { VendaItensController } from './venda_itens.controller';
import { VendaItensService } from './venda_itens.service';

describe('VendaItensController', () => {
  let controller: VendaItensController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendaItensController],
      providers: [VendaItensService],
    }).compile();

    controller = module.get<VendaItensController>(VendaItensController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
