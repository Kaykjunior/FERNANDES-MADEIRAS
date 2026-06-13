import { Test, TestingModule } from '@nestjs/testing';
import { AuditoriaLogsController } from './auditoria_logs.controller';
import { AuditoriaLogsService } from './auditoria_logs.service';

describe('AuditoriaLogsController', () => {
  let controller: AuditoriaLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditoriaLogsController],
      providers: [AuditoriaLogsService],
    }).compile();

    controller = module.get<AuditoriaLogsController>(AuditoriaLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
