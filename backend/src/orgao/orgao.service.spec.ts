import { Test, TestingModule } from '@nestjs/testing';
import { OrgaoService } from './orgao.service';

describe('OrgaoService', () => {
  let service: OrgaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrgaoService],
    }).compile();

    service = module.get<OrgaoService>(OrgaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
