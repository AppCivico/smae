import { Module } from '@nestjs/common';
import { OrcamentoExecutadoService } from './orcamento-executado.service';
import { OrcamentoExecutadoController } from './orcamento-executado.controller';

@Module({
  controllers: [OrcamentoExecutadoController],
  providers: [OrcamentoExecutadoService]
})
export class OrcamentoExecutadoModule {}
