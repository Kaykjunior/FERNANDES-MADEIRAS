import { Test, TestingModule } from '@nestjs/testing';
import { ContasReceberController } from './contas_receber.controller';
import { ContasReceberService } from './contas_receber.service';

describe('ContasReceberController', () => {
  let controller: ContasReceberController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContasReceberController],
      providers: [ContasReceberService],
    }).compile();

    controller = module.get<ContasReceberController>(ContasReceberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
