import { Test, TestingModule } from '@nestjs/testing';
import { MinhaContaController } from './minha-conta.controller';

describe('MinhaContaController', () => {
  let controller: MinhaContaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MinhaContaController],
    }).compile();

    controller = module.get<MinhaContaController>(MinhaContaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
