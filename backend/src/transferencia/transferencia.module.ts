import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TransferenciaService } from './transferencia.service';
import { TransferenciaTipoController } from './transferencia-tipo.controller';
import { TransferenciaController } from './transferencia.controller';
import { UploadModule } from 'src/upload/upload.module';
import { JwtModule } from '@nestjs/jwt';
import { TransferenciaTarefaController } from './transferencia-tarefa.controller';
import { TarefaModule } from 'src/pp/tarefa/tarefa.module';

@Module({
    imports: [
        PrismaModule,
        UploadModule,
        forwardRef(() => TarefaModule),
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [TransferenciaController, TransferenciaTipoController, TransferenciaTarefaController],
    providers: [TransferenciaService],
    exports: [TransferenciaService],
})
export class TransferenciaModule {}
