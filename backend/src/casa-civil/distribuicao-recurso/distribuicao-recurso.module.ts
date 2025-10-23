import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DistribuicaoRecursoController } from './distribuicao-recurso.controller';
import { DistribuicaoRecursoService } from './distribuicao-recurso.service';
import { BlocoNotaModule } from '../../bloco-nota/bloco-nota/bloco-nota.module';
import { NotaModule } from '../../bloco-nota/nota/nota.module';
import { AvisoEmailModule } from '../../aviso-email/aviso-email.module';
import { DistribuicaoRecursoStatusService } from './distribuicao-recurso-status.service';
import { DistribuicaoRecursoStatusController } from './distribuicao-recurso-status.controller';
import { TarefaModule } from 'src/pp/tarefa/tarefa.module';
import { SeiIntegracaoModule } from '../../sei-integracao/sei-integracao.module';
import { WorkflowModule } from '../workflow/configuracao/workflow.module';
import { TransferenciaModule } from '../transferencia/transferencia.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
        BlocoNotaModule,
        NotaModule,
        AvisoEmailModule,
        forwardRef(() => TarefaModule),
        SeiIntegracaoModule,
        WorkflowModule,
        forwardRef(() => TransferenciaModule),
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [DistribuicaoRecursoController, DistribuicaoRecursoStatusController],
    providers: [DistribuicaoRecursoService, DistribuicaoRecursoStatusService],
    exports: [DistribuicaoRecursoService, DistribuicaoRecursoStatusService],
})
export class DistribuicaoRecursoModule {}
