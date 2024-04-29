import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DistribuicaoRecursoController } from './distribuicao-recurso.controller';
import { DistribuicaoRecursoService } from './distribuicao-recurso.service';
import { WorkflowModule } from 'src/workflow/configuracao/workflow.module';

@Module({
    imports: [PrismaModule, WorkflowModule],
    controllers: [DistribuicaoRecursoController],
    providers: [DistribuicaoRecursoService],
    exports: [DistribuicaoRecursoService],
})
export class DistribuicaoRecursoModule {}
