import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowAndamentoTarefasController } from './workflow-andamento-tarefas.controller';
import { WorkflowAndamentoTarefasService } from './workflow-andamento-tarefas.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowAndamentoTarefasController],
    providers: [WorkflowAndamentoTarefasService],
    exports: [WorkflowAndamentoTarefasService],
})
export class WorkflowAndamentoTarefasModule {}
