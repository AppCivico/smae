import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowTarefaController } from './workflow-tarefa.controller';
import { WorkflowTarefaService } from './workflow-tarefa.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowTarefaController],
    providers: [WorkflowTarefaService],
    exports: [WorkflowTarefaService],
})
export class WorkflowTarefaModule {}
