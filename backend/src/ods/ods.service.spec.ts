import { Test, TestingModule } from '@nestjs/testing';
import { OdsService } from './ods.service';

describe('OdsService', () => {
  let service: OdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OdsService],
    }).compile();

    service = module.get<OdsService>(OdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
