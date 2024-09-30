import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowFluxoController } from './workflow-fluxo.controller';
import { WorkflowFluxoService } from './workflow-fluxo.service';
import { WorkflowModule } from '../workflow.module';

@Module({
    imports: [PrismaModule, WorkflowModule],
    controllers: [WorkflowFluxoController],
    providers: [WorkflowFluxoService],
    exports: [WorkflowFluxoService],
})
export class WorkflowFluxoModule {}
