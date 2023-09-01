import { Module } from '@nestjs/common';
import { OrcamentoModule } from '../orcamento/orcamento.module';
import { ProjetoOrcamentoController } from './projeto-orcamento.controller';

@Module({
    imports: [OrcamentoModule],
    controllers: [ProjetoOrcamentoController],
})
export class ProjetoOrcamentoModule {}
