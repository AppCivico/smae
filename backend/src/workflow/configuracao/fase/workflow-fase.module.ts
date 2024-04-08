import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowFaseController } from './workflow-fase.controller';
import { WorkflowFaseService } from './workflow-fase.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowFaseController],
    providers: [WorkflowFaseService],
    exports: [WorkflowFaseService],
})
export class WorkflowFaseModule {}
