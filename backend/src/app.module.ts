import { MiddlewareConsumer, Module, NestModule, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AllExceptionsFilter } from './any-error.filter';
import { AppController } from './app.controller';
import { AppModuleCommon } from './app.module.common';
import { AppModulePdm } from './app.module.pdm';
import { AppModuleProjeto } from './app.module.projeto';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PessoaPrivilegioModule } from './auth/pessoaPrivilegio.module';
import { AvisoEmailModule } from './aviso-email/aviso-email.module';
import { BancadaModule } from './bancada/bancada.module';
import { BlocoNotasModule } from './bloco-nota/bloco-notas.module';
import { DashTransferenciaModule } from './casa-civil/dash/transferencia.module';
import { TransferenciaModule } from './casa-civil/transferencia/transferencia.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TrimPipe } from './common/pipes/trim-pipe';
import { CommonBaseModule } from './common/services/base.module';
import { ContentInterceptor } from './content.interceptor';
import { CTPConfigModule } from './cronograma-termino-planejado-config/ctp-config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DistribuicaoRecursoModule } from './distribuicao-recurso/distribuicao-recurso.module';
import { DotacaoModule } from './dotacao/dotacao.module';
import { EleicaoModule } from './eleicao/eleicao.module';
import { MinhaContaModule } from './minha-conta/minha-conta.module';
import { OrcamentoPlanejadoModule } from './orcamento-planejado/orcamento-planejado.module';
import { OrcamentoRealizadoModule } from './orcamento-realizado/orcamento-realizado.module';
import { ParlamentarModule } from './parlamentar/parlamentar.modules';
import { PartidoModule } from './partido/partido.module';
import { OrcamentoPrevistoModule } from './pp/orcamento-previsto/orcamento-previsto.module';
import { PrismaErrorFilterUnknown } from './prisma-error-unknown.filter';
import { PrismaErrorFilter } from './prisma-error.filter';
import { PrismaModule } from './prisma/prisma.module';
import { OrcamentoModule } from './reports/orcamento/orcamento.module';
import { ReportsModule } from './reports/relatorios/reports.module';
import { UtilsService } from './reports/utils/utils.service';
import { RequestLogModule } from './request_log/request_log.module';
import { WorkflowAndamentoFaseModule } from './workflow/andamento/fase/workflow-andamento-fase.module';
import { WorkflowAndamentoModule } from './workflow/andamento/workflow-andamento.module';
import { WorkflowEtapaModule } from './workflow/configuracao/etapa/workflow-etapa.module';
import { WorkflowFaseModule } from './workflow/configuracao/fase/workflow-fase.module';
import { WorkflowfluxoFaseModule } from './workflow/configuracao/fluxo-fase/workflow-fluxo-fase.module';
import { WorkflowFluxoTarefaModule } from './workflow/configuracao/fluxo-tarefa/workflow-fluxo-tarefa.module';
import { WorkflowFluxoModule } from './workflow/configuracao/fluxo/workflow-fluxo.module';
import { WorkflowSituacaoModule } from './workflow/configuracao/situacao/workflow-situacao.module';
import { WorkflowTarefaModule } from './workflow/configuracao/tarefa/workflow-tarefa.module';
import { WorkflowModule } from './workflow/configuracao/workflow.module';
import { TaskModule } from './task/task.module';

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
        WorkflowTarefaModule,
        WorkflowFluxoModule,
        WorkflowfluxoFaseModule,
        WorkflowFluxoTarefaModule,
        WorkflowAndamentoModule,
        WorkflowAndamentoFaseModule,
        BlocoNotasModule,
        DashTransferenciaModule,
        PessoaPrivilegioModule,
        CommonBaseModule,
        TaskModule,
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
            useClass: AllExceptionsFilter,
        },
        {
            provide: APP_FILTER,
            useClass: PrismaErrorFilter,
        },
        {
            provide: APP_FILTER,
            useClass: PrismaErrorFilterUnknown,
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
