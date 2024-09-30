import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowAndamentoController } from './workflow-andamento.controller';
import { WorkflowAndamentoService } from './workflow-andamento.service';
import { WorkflowModule } from '../configuracao/workflow.module';

@Module({
    imports: [PrismaModule, WorkflowModule],
    controllers: [WorkflowAndamentoController],
    providers: [WorkflowAndamentoService],
    exports: [WorkflowAndamentoService],
})
export class WorkflowAndamentoModule {}
