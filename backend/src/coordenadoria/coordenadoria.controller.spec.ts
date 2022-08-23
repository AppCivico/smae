import { Test, TestingModule } from '@nestjs/testing';
import { CoordenadoriaController } from './coordenadoria.controller';
import { CoordenadoriaService } from './coordenadoria.service';

describe('CoordenadoriaController', () => {
  let controller: CoordenadoriaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoordenadoriaController],
      providers: [CoordenadoriaService],
    }).compile();

    controller = module.get<CoordenadoriaController>(CoordenadoriaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
