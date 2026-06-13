import { Test, TestingModule } from '@nestjs/testing';
import { MovimentacoesEstoqueController } from './movimentacoes_estoque.controller';
import { MovimentacoesEstoqueService } from './movimentacoes_estoque.service';

describe('MovimentacoesEstoqueController', () => {
  let controller: MovimentacoesEstoqueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovimentacoesEstoqueController],
      providers: [MovimentacoesEstoqueService],
    }).compile();

    controller = module.get<MovimentacoesEstoqueController>(MovimentacoesEstoqueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
