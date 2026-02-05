import {
    BadRequestException,
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
    ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AllExceptionsFilter } from './any-error.filter';
import { AppController } from './app.controller';
import { AppModuleCasaCivil } from './app.module.casa-civil';
import { AppModuleCommon } from './app.module.common';
import { AppModuleOrcamento } from './app.module.orcamento';
import { AppModulePdm } from './app.module.pdm';
import { AppModuleProjeto } from './app.module.projeto';
import { AppModuleWorkflow } from './app.module.workflow';
import { AppService } from './app.service';
import { AtualizacaoEmLoteModule } from './atualizacao-em-lote/atualizacao-em-lote.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PessoaPrivilegioModule } from './auth/pessoaPrivilegio.module';
import { AvisoEmailModule } from './aviso-email/aviso-email.module';
import { BancadaModule } from './bancada/bancada.module';
import { BlocoNotasModule } from './bloco-nota/bloco-notas.module';
import { BuscaGlobalModule } from './busca-global/busca-global.module';
import { CategoriaAssuntoVariavelModule } from './categoria-assunto-variavel/categoria-assunto-variavel.module';
import { DuckDBModule } from './common/duckdb/duckdb.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TrimPipe } from './common/pipes/trim-pipe';
import { CommonBaseModule } from './common/services/base.module';
import { ContentInterceptor } from './content.interceptor';
import { CTPConfigModule } from './cronograma-termino-planejado-config/ctp-config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EleicaoModule } from './eleicao/eleicao.module';
import { GeoBuscaModule } from './geo-busca/geo-busca.module';
import { PainelEstrategicoModule } from './gestao-projetos/painel-estrategico/painel-estrategico.module';
import { PSMFDashboardModule } from './mf/ps-dash/ps-dash.module';
import { MinhaContaModule } from './minha-conta/minha-conta.module';
import { PartidoModule } from './partido/partido.module';
import { PortfolioTagModule } from './pp/portfolio-tag/portfolio-tag.module';
import { TermoEncerramentoModule } from './pp/termo-encerramento/termo-encerramento.module';
import { ProjetoTipoAditivoModule } from './tipo-aditivo/tipo-aditivo.module';
import { TipoEncerramentoModule } from './projeto-tipo-encerramento/tipo-encerramento.module';
import { ParlamentarModule } from './parlamentar/parlamentar.modules';
import { PrismaErrorFilterUnknown } from './prisma-error-unknown.filter';
import { PrismaErrorFilter } from './prisma-error.filter';
import { PrismaModule } from './prisma/prisma.module';
import { exceptionFactory } from './common/validation/validation-exception-factory';
import { ReportsModule } from './reports/relatorios/reports.module';
import { RequestLogModule } from './request_log/request_log.module';
import { RunReportModule } from './task/run_report/run-report.module';
import { SyncCadastroBasicoModule } from './sync-cadastro-basico/sync-cadastro-basico.module';
import { TaskModule } from './task/task.module';
import { ClassificacaoModule } from './transferencias-voluntarias/classificacao/classificacao.module';
import { WikiLinkModule } from './wiki-link/wiki-link.module';
import { TransfereGovApiModule } from './transfere-gov-api/transfere-gov-api.module';
import { UtilsService } from './reports/utils/utils.service';

// Hacks pro JS
/*
 * Convert all BigInt into strings just to be safe
 */
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

/**
 * Main application module
 * 
 * Module organization:
 * - AppModuleCommon: Base/common modules (Auth, Pessoa, Orgao, Upload, etc.)
 * - AppModulePdm: PDM (Plano de Metas) related modules
 * - AppModuleProjeto: Project management related modules
 * - AppModuleWorkflow: Workflow configuration and management modules
 * - AppModuleCasaCivil: Casa Civil related modules (Demanda, Transferencia, etc.)
 * - AppModuleOrcamento: Budget/financial modules
 */
@Module({
    imports: [
        // Core
        ConfigModule.forRoot(),
        PrismaModule,
        RequestLogModule,
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/public',
        }),

        // Feature module groups
        AppModuleCommon,
        AppModulePdm,
        AppModuleProjeto,
        AppModuleWorkflow,
        AppModuleCasaCivil,
        AppModuleOrcamento,

        // Reports & Dashboards
        ReportsModule,
        DashboardModule,
        PainelEstrategicoModule,
        PSMFDashboardModule,
        RunReportModule,

        // Cross-cutting concerns
        TaskModule,
        AvisoEmailModule,
        BlocoNotasModule,
        MinhaContaModule,
        CommonBaseModule,
        PessoaPrivilegioModule,

        // Supporting modules
        BancadaModule,
        PartidoModule,
        ParlamentarModule,
        EleicaoModule,
        CTPConfigModule,
        TipoEncerramentoModule,
        TermoEncerramentoModule,
        CategoriaAssuntoVariavelModule,
        SyncCadastroBasicoModule,
        DuckDBModule,
        TransfereGovApiModule,
        GeoBuscaModule,
        BuscaGlobalModule,
        AtualizacaoEmLoteModule,
        WikiLinkModule,
        ClassificacaoModule,
        PortfolioTagModule,
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
                exceptionFactory: exceptionFactory,
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
