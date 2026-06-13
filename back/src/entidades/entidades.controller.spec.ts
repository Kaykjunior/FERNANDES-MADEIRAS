import { Test, TestingModule } from '@nestjs/testing';
import { EntidadesController } from './entidades.controller';
import { EntidadesService } from './entidades.service';

describe('EntidadesController', () => {
  let controller: EntidadesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntidadesController],
      providers: [EntidadesService],
    }).compile();

    controller = module.get<EntidadesController>(EntidadesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
