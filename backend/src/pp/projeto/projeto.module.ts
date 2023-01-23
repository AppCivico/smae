import { Module } from '@nestjs/common';
import { ProjetoService } from './projeto.service';
import { ProjetoController } from './projeto.controller';

@Module({
  controllers: [ProjetoController],
  providers: [ProjetoService]
})
export class ProjetoModule {}
