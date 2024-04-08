import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowFluxoTarefaController } from './workflow-fluxo-tarefa.controller';
import { WorkflowFluxoTarefaService } from './workflow-fluxo-tarefa.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowFluxoTarefaController],
    providers: [WorkflowFluxoTarefaService],
    exports: [WorkflowFluxoTarefaService],
})
export class WorkflowFluxoTarefaModule {}
