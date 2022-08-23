import { Test, TestingModule } from '@nestjs/testing';
import { TipoOrgaoController } from './tipo-orgao.controller';
import { TipoOrgaoService } from './tipo-orgao.service';

describe('TipoOrgaoController', () => {
  let controller: TipoOrgaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoOrgaoController],
      providers: [TipoOrgaoService],
    }).compile();

    controller = module.get<TipoOrgaoController>(TipoOrgaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
