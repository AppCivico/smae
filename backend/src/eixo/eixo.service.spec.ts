import { Test, TestingModule } from '@nestjs/testing';
import { EixoService } from './eixo.service';

describe('EixoService', () => {
  let service: EixoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EixoService],
    }).compile();

    service = module.get<EixoService>(EixoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
