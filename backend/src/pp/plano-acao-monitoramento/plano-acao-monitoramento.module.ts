import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { PlanoAcaoMonitoramentoController } from './plano-acao-monitoramento.controller';
import { PlanoAcaoMonitoramentoService } from './plano-acao-monitoramento.service';

@Module({
    imports: [PrismaModule, ProjetoModule],
    controllers: [PlanoAcaoMonitoramentoController],
    providers: [PlanoAcaoMonitoramentoService],
})
export class PlanoAcaoMonitoramentoModule {}
