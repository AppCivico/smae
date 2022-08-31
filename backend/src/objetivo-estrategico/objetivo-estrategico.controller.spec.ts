import { Test, TestingModule } from '@nestjs/testing';
import { ObjetivoEstrategicoController } from './objetivo-estrategico.controller';
import { ObjetivoEstrategicoService } from './objetivo-estrategico.service';

describe('ObjetivoEstrategicoController', () => {
  let controller: ObjetivoEstrategicoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObjetivoEstrategicoController],
      providers: [ObjetivoEstrategicoService],
    }).compile();

    controller = module.get<ObjetivoEstrategicoController>(ObjetivoEstrategicoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
