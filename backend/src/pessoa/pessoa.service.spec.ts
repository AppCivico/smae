import { Test, TestingModule } from '@nestjs/testing';
import { PessoaService } from './pessoa.service';

describe('PessoaService', () => {
  let service: PessoaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PessoaService],
    }).compile();

    service = module.get<PessoaService>(PessoaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
