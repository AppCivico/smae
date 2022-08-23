import { Test, TestingModule } from '@nestjs/testing';
import { DepartamentoService } from './departamento.service';

describe('DepartamentoService', () => {
  let service: DepartamentoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartamentoService],
    }).compile();

    service = module.get<DepartamentoService>(DepartamentoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
