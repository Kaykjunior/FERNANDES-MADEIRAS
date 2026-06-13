import { Test, TestingModule } from '@nestjs/testing';
import { ComissoesService } from './comissoes.service';

describe('ComissoesService', () => {
  let service: ComissoesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComissoesService],
    }).compile();

    service = module.get<ComissoesService>(ComissoesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
