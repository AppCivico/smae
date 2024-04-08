import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowfluxoFaseController } from './workflow-fluxo-fase.controller';
import { WorkflowfluxoFaseService } from './workflow-fluxo-fase.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowfluxoFaseController],
    providers: [WorkflowfluxoFaseService],
    exports: [WorkflowfluxoFaseService],
})
export class WorkflowfluxoFaseModule {}
