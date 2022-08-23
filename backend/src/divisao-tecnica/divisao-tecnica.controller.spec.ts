import { Test, TestingModule } from '@nestjs/testing';
import { DivisaoTecnicaController } from './divisao-tecnica.controller';
import { DivisaoTecnicaService } from './divisao-tecnica.service';

describe('DivisaoTecnicaController', () => {
  let controller: DivisaoTecnicaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DivisaoTecnicaController],
      providers: [DivisaoTecnicaService],
    }).compile();

    controller = module.get<DivisaoTecnicaController>(DivisaoTecnicaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
