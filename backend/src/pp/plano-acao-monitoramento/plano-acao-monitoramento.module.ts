import { Module } from '@nestjs/common';
import { PlanoAcaoMonitoramentoService } from './plano-acao-monitoramento.service';
import { PlanoAcaoMonitoramentoController } from './plano-acao-monitoramento.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PlanoAcaoMonitoramentoController],
    providers: [PlanoAcaoMonitoramentoService]
})
export class PlanoAcaoMonitoramentoModule { }
