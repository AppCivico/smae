import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TransferenciaService } from './transferencia.service';
import { TransferenciaTipoController } from './tipo/transferencia-tipo.controller';
import { TransferenciaController } from './transferencia.controller';
import { UploadModule } from 'src/upload/upload.module';
import { JwtModule } from '@nestjs/jwt';
import { TransferenciaTarefaController } from './transferencia-tarefa.controller';
import { TarefaModule } from 'src/pp/tarefa/tarefa.module';
import { BlocoNotaModule } from '../../bloco-nota/bloco-nota/bloco-nota.module';
import { WorkflowModule } from 'src/workflow/configuracao/workflow.module';
import { DistribuicaoRecursoModule } from 'src/casa-civil/distribuicao-recurso/distribuicao-recurso.module';
import { TransferenciaTipoService } from './tipo/transferencia-tipo.service';
import { DistribuicaoStatusController } from './distribuicao-status/distribuicao-status.controller';
import { DistribuicaoStatusService } from './distribuicao-status/distribuicao-status.service';

@Module({
    imports: [
        PrismaModule,
        UploadModule,
        WorkflowModule,
        forwardRef(() => TarefaModule),
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
        BlocoNotaModule,
        DistribuicaoRecursoModule,
    ],
    controllers: [
        TransferenciaController,
        TransferenciaTipoController,
        DistribuicaoStatusController,
        TransferenciaTarefaController,
    ],
    providers: [TransferenciaService, TransferenciaTipoService, DistribuicaoStatusService],
    exports: [TransferenciaService],
})
export class TransferenciaModule {}
