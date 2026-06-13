import { Test, TestingModule } from '@nestjs/testing';
import { RomaneiosController } from './romaneios.controller';
import { RomaneiosService } from './romaneios.service';

describe('RomaneiosController', () => {
  let controller: RomaneiosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RomaneiosController],
      providers: [RomaneiosService],
    }).compile();

    controller = module.get<RomaneiosController>(RomaneiosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
