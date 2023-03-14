import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlanoAcaoMonitoramentoController } from './plano-acao-monitoramento.controller';
import { PlanoAcaoMonitoramentoService } from './plano-acao-monitoramento.service';

@Module({
    imports: [PrismaModule],
    controllers: [PlanoAcaoMonitoramentoController],
    providers: [PlanoAcaoMonitoramentoService]
})
export class PlanoAcaoMonitoramentoModule { }
