import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowSituacaoController } from './workflow-situacao.controller';
import { WorkflowSituacaoService } from './workflow-situacao.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowSituacaoController],
    providers: [WorkflowSituacaoService],
    exports: [WorkflowSituacaoService],
})
export class WorkflowSituacaoModule {}
