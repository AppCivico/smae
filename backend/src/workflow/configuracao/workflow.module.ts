import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowController],
    providers: [WorkflowService],
    exports: [WorkflowService],
})
export class WorkflowModule {}
