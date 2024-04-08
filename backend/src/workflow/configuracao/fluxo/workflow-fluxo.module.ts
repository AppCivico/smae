import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowFluxoController } from './workflow-fluxo.controller';
import { WorkflowFluxoService } from './workflow-fluxo.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowFluxoController],
    providers: [WorkflowFluxoService],
    exports: [WorkflowFluxoService],
})
export class WorkflowFluxoModule {}
