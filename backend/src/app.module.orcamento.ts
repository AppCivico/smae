import { Module } from '@nestjs/common';
import { DotacaoBuscaModule } from './dotacao-busca/dotacao-busca.module';
import { DotacaoModule } from './dotacao/dotacao.module';
import { OrcamentoPlanejadoModule } from './orcamento-planejado/orcamento-planejado.module';
import { OrcamentoRealizadoModule } from './orcamento-realizado/orcamento-realizado.module';
import { OrcamentoPrevistoModule } from './pp/orcamento-previsto/orcamento-previsto.module';
import { OrcamentoModule } from './reports/orcamento/orcamento.module';

/**
 * Orcamento (Budget) modules aggregation
 * Consolidates budget-related modules across different domains:
 * - Dotacao (budget allocation)
 * - OrcamentoPlanejado (planned budget)
 * - OrcamentoRealizado (actual/realized budget)
 * - OrcamentoPrevisto (forecasted budget)
 */
@Module({
    imports: [
        DotacaoModule,
        DotacaoBuscaModule,
        OrcamentoModule,
        OrcamentoPlanejadoModule,
        OrcamentoRealizadoModule,
        OrcamentoPrevistoModule,
    ],
})
export class AppModuleOrcamento {}
