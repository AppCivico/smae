import { Test, TestingModule } from '@nestjs/testing';
import { OdsController } from './ods.controller';
import { OdsService } from './ods.service';

describe('OdsController', () => {
  let controller: OdsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OdsController],
      providers: [OdsService],
    }).compile();

    controller = module.get<OdsController>(OdsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
