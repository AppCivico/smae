import { Module } from '@nestjs/common';
import { OrcamentoModule } from '../orcamento/orcamento.module';
import { ProjetoMDOOrcamentoController, ProjetoOrcamentoController } from './projeto-orcamento.controller';

@Module({
    imports: [OrcamentoModule],
    controllers: [ProjetoOrcamentoController, ProjetoMDOOrcamentoController],
})
export class ProjetoOrcamentoModule {}
