import { Test, TestingModule } from '@nestjs/testing';
import { CoordenadoriaService } from './coordenadoria.service';

describe('CoordenadoriaService', () => {
  let service: CoordenadoriaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoordenadoriaService],
    }).compile();

    service = module.get<CoordenadoriaService>(CoordenadoriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
