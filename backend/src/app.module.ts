import { MiddlewareConsumer, Module, NestModule, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppModuleCommon } from './app.module.common';
import { AppModulePdm } from './app.module.pdm';
import { AppModuleProjeto } from './app.module.projeto';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AvisoEmailModule } from './aviso-email/aviso-email.module';
import { BancadaModule } from './bancada/bancada.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TrimPipe } from './common/pipes/trim-pipe';
import { ContentInterceptor } from './content.interceptor';
import { CronogramaEtapaModule } from './cronograma-etapas/cronograma-etapas.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DistribuicaoRecursoModule } from './distribuicao-recurso/distribuicao-recurso.module';
import { DotacaoModule } from './dotacao/dotacao.module';
import { EleicaoModule } from './eleicao/eleicao.module';
import { ErrorFilter } from './error.filter';
import { MinhaContaModule } from './minha-conta/minha-conta.module';
import { OrcamentoPlanejadoModule } from './orcamento-planejado/orcamento-planejado.module';
import { OrcamentoRealizadoModule } from './orcamento-realizado/orcamento-realizado.module';
import { ParlamentarModule } from './parlamentar/parlamentar.modules';
import { PartidoModule } from './partido/partido.module';
import { OrcamentoPrevistoModule } from './pp/orcamento-previsto/orcamento-previsto.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrcamentoModule } from './reports/orcamento/orcamento.module';
import { ReportsModule } from './reports/relatorios/reports.module';
import { UtilsService } from './reports/utils/utils.service';
import { RequestLogModule } from './request_log/request_log.module';
import { TransferenciaModule } from './transferencia/transferencia.module';
import { CTPConfigModule } from './cronograma-termino-planejado-config/ctp-config.module';
import { WorkflowModule } from './workflow/workflow.module';
import { WorkflowEtapaModule } from './workflow/etapa/workflow-etapa.module';
import { WorkflowFaseModule } from './workflow/fase/workflow-fase.module';
import { WorkflowSituacaoModule } from './workflow/situacao/workflow-situacao.module';

// Hacks pro JS
/*
 * Convert all BigInt into strings just to be safe
 */
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

@Module({
    imports: [
        ConfigModule.forRoot(),
        PrismaModule,
        AppModuleCommon,
        AppModulePdm,
        AppModuleProjeto,
        RequestLogModule,
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/public',
        }),
        ReportsModule,
        MinhaContaModule,
        DotacaoModule,
        OrcamentoModule,
        OrcamentoPlanejadoModule,
        OrcamentoRealizadoModule,
        CronogramaEtapaModule,
        OrcamentoPrevistoModule,
        DashboardModule,
        BancadaModule,
        PartidoModule,
        ParlamentarModule,
        EleicaoModule,
        TransferenciaModule,
        DistribuicaoRecursoModule,
        AvisoEmailModule,
        CTPConfigModule,
        WorkflowModule,
        WorkflowEtapaModule,
        WorkflowFaseModule,
        WorkflowSituacaoModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
        {
            provide: APP_FILTER,
            useClass: ErrorFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ContentInterceptor,
        },
        {
            provide: APP_PIPE,
            useValue: new TrimPipe(),
        },
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                enableDebugMessages: true,
                dismissDefaultMessages: false,
                transform: true,
                whitelist: true,
                // comentando isso, pq não temos como garantir que o OAuth não vai botar um campo novo
                // no callback
                // e o o único jeito seria colocando um ValidationPipe em cada controller, ou listando
                // todos os controllers... então fica desligado
                //forbidNonWhitelisted: true,
            }),
        },
        UtilsService,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes({
            path: '*',
            method: RequestMethod.ALL,
        });
    }
}
