import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracoesFiscaisCfopController } from './configuracoes_fiscais_cfop.controller';
import { ConfiguracoesFiscaisCfopService } from './configuracoes_fiscais_cfop.service';

describe('ConfiguracoesFiscaisCfopController', () => {
  let controller: ConfiguracoesFiscaisCfopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfiguracoesFiscaisCfopController],
      providers: [ConfiguracoesFiscaisCfopService],
    }).compile();

    controller = module.get<ConfiguracoesFiscaisCfopController>(ConfiguracoesFiscaisCfopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
