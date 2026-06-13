import { Test, TestingModule } from '@nestjs/testing';
import { AuditoriaLogsService } from './auditoria_logs.service';

describe('AuditoriaLogsService', () => {
  let service: AuditoriaLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditoriaLogsService],
    }).compile();

    service = module.get<AuditoriaLogsService>(AuditoriaLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
