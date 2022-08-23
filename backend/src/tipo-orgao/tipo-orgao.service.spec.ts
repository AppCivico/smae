import { Test, TestingModule } from '@nestjs/testing';
import { TipoOrgaoService } from './tipo-orgao.service';

describe('TipoOrgaoService', () => {
  let service: TipoOrgaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipoOrgaoService],
    }).compile();

    service = module.get<TipoOrgaoService>(TipoOrgaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
