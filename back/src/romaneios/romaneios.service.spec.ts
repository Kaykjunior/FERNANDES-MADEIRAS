import { Test, TestingModule } from '@nestjs/testing';
import { RomaneiosService } from './romaneios.service';

describe('RomaneiosService', () => {
  let service: RomaneiosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RomaneiosService],
    }).compile();

    service = module.get<RomaneiosService>(RomaneiosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
