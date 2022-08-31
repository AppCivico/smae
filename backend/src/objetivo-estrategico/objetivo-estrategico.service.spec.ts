import { Test, TestingModule } from '@nestjs/testing';
import { ObjetivoEstrategicoService } from './objetivo-estrategico.service';

describe('ObjetivoEstrategicoService', () => {
  let service: ObjetivoEstrategicoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObjetivoEstrategicoService],
    }).compile();

    service = module.get<ObjetivoEstrategicoService>(ObjetivoEstrategicoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
