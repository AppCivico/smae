import { Test, TestingModule } from '@nestjs/testing';
import { EixoController } from './eixo.controller';
import { EixoService } from './eixo.service';

describe('EixoController', () => {
  let controller: EixoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EixoController],
      providers: [EixoService],
    }).compile();

    controller = module.get<EixoController>(EixoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
