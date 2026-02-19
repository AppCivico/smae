import { Module } from '@nestjs/common';
import { WorkflowAndamentoFaseModule } from './casa-civil/workflow/andamento/fase/workflow-andamento-fase.module';
import { WorkflowAndamentoModule } from './casa-civil/workflow/andamento/workflow-andamento.module';
import { WorkflowEtapaModule } from './casa-civil/workflow/configuracao/etapa/workflow-etapa.module';
import { WorkflowFaseModule } from './casa-civil/workflow/configuracao/fase/workflow-fase.module';
import { WorkflowfluxoFaseModule } from './casa-civil/workflow/configuracao/fluxo-fase/workflow-fluxo-fase.module';
import { WorkflowFluxoTarefaModule } from './casa-civil/workflow/configuracao/fluxo-tarefa/workflow-fluxo-tarefa.module';
import { WorkflowFluxoModule } from './casa-civil/workflow/configuracao/fluxo/workflow-fluxo.module';
import { WorkflowSituacaoModule } from './casa-civil/workflow/configuracao/situacao/workflow-situacao.module';
import { WorkflowTarefaModule } from './casa-civil/workflow/configuracao/tarefa/workflow-tarefa.module';
import { WorkflowModule } from './casa-civil/workflow/configuracao/workflow.module';

/**
 * Workflow modules aggregation
 * Consolidates all workflow-related modules to reduce clutter in AppModule
 */
@Module({
    imports: [
        WorkflowModule,
        WorkflowEtapaModule,
        WorkflowFaseModule,
        WorkflowSituacaoModule,
        WorkflowTarefaModule,
        WorkflowFluxoModule,
        WorkflowfluxoFaseModule,
        WorkflowFluxoTarefaModule,
        WorkflowAndamentoModule,
        WorkflowAndamentoFaseModule,
    ],
})
export class AppModuleWorkflow {}
