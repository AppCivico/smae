import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowAndamentoFaseController } from './workflow-andamento-fase.controller';
import { WorkflowAndamentoFaseService } from './workflow-andamento-fase.service';
import { WorkflowModule } from '../../configuracao/workflow.module';
import { WorkflowAndamentoModule } from '../workflow-andamento.module';

@Module({
    imports: [PrismaModule, WorkflowModule, WorkflowAndamentoModule],
    controllers: [WorkflowAndamentoFaseController],
    providers: [WorkflowAndamentoFaseService],
    exports: [WorkflowAndamentoFaseService],
})
export class WorkflowAndamentoFaseModule {}
