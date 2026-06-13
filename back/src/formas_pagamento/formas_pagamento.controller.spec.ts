import { Test, TestingModule } from '@nestjs/testing';
import { FormasPagamentoController } from './formas_pagamento.controller';
import { FormasPagamentoService } from './formas_pagamento.service';

describe('FormasPagamentoController', () => {
  let controller: FormasPagamentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormasPagamentoController],
      providers: [FormasPagamentoService],
    }).compile();

    controller = module.get<FormasPagamentoController>(FormasPagamentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
