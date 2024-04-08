import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowEtapaController } from './workflow-etapa.controller';
import { WorkflowEtapaService } from './workflow-etapa.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowEtapaController],
    providers: [WorkflowEtapaService],
    exports: [WorkflowEtapaService],
})
export class WorkflowEtapaModule {}
