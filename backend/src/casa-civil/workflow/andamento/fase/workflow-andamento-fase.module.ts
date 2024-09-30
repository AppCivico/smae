import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowAndamentoFaseController } from './workflow-andamento-fase.controller';
import { WorkflowAndamentoFaseService } from './workflow-andamento-fase.service';
import { WorkflowModule } from '../../configuracao/workflow.module';

@Module({
    imports: [PrismaModule, WorkflowModule],
    controllers: [WorkflowAndamentoFaseController],
    providers: [WorkflowAndamentoFaseService],
    exports: [WorkflowAndamentoFaseService],
})
export class WorkflowAndamentoFaseModule {}
