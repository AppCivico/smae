import { Test, TestingModule } from '@nestjs/testing';
import { DivisaoTecnicaService } from './divisao-tecnica.service';

describe('DivisaoTecnicaService', () => {
  let service: DivisaoTecnicaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DivisaoTecnicaService],
    }).compile();

    service = module.get<DivisaoTecnicaService>(DivisaoTecnicaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
