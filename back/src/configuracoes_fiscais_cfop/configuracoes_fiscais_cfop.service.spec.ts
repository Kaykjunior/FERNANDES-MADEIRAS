import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracoesFiscaisCfopService } from './configuracoes_fiscais_cfop.service';

describe('ConfiguracoesFiscaisCfopService', () => {
  let service: ConfiguracoesFiscaisCfopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfiguracoesFiscaisCfopService],
    }).compile();

    service = module.get<ConfiguracoesFiscaisCfopService>(ConfiguracoesFiscaisCfopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
