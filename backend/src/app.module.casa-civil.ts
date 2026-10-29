import { Module } from '@nestjs/common';
import { AreaTematicaModule } from './casa-civil/area-tematica/area-tematica.module';
import { DashTransferenciaModule } from './casa-civil/dash/transferencia.module';
import { DemandaConfigModule } from './casa-civil/demanda-config/demanda-config.module';
import { DemandaModule } from './casa-civil/demanda/demanda.module';
import { DistribuicaoRecursoModule } from './casa-civil/distribuicao-recurso/distribuicao-recurso.module';
import { PainelParlamentarModule } from './casa-civil/painel-parlamentar/painel-parlamentar.module';
import { TipoVinculoModule } from './casa-civil/tipo-vinculo/tipo-vinculo.module';
import { TransferenciaModule } from './casa-civil/transferencia/transferencia.module';
import { TransferenciaOrcamentoRealizadoModule } from './casa-civil/transferencia-orcamento-realizado/transferencia-orcamento-realizado.module';
import { VinculoModule } from './casa-civil/vinculo/vinculo.module';

/**
 * Casa Civil modules aggregation
 * Consolidates all Casa Civil related modules:
 * - Demanda (tickets/requests)
 * - Transferencia (transfers)
 * - DistribuicaoRecurso (resource distribution)
 * - Vinculo (links between entities)
 * - Dashboard and config modules
 */
@Module({
    imports: [
        DemandaModule,
        DemandaConfigModule,
        TransferenciaModule,
        TransferenciaOrcamentoRealizadoModule,
        DistribuicaoRecursoModule,
        DashTransferenciaModule,
        VinculoModule,
        TipoVinculoModule,
        AreaTematicaModule,
        PainelParlamentarModule,
    ],
})
export class AppModuleCasaCivil {}
