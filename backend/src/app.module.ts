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
import { AppModuleGeo } from './app.module.geo';
import { AppModuleIntegrations } from './app.module.integrations';
import { AppModuleOrcamento } from './app.module.orcamento';
import { AppModulePdm } from './app.module.pdm';
import { AppModuleProjeto } from './app.module.projeto';
import { AppModuleReports } from './app.module.reports';
import { AppModuleSupporting } from './app.module.supporting';
import { AppModuleTasks } from './app.module.tasks';
import { AppModuleWorkflow } from './app.module.workflow';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PessoaPrivilegioModule } from './auth/pessoaPrivilegio.module';
import { ContentInterceptor } from './content.interceptor';
import { DuckDBModule } from './common/duckdb/duckdb.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TrimPipe } from './common/pipes/trim-pipe';
import { CommonBaseModule } from './common/services/base.module';
import { exceptionFactory } from './common/validation/validation-exception-factory';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaErrorFilter } from './prisma-error.filter';
import { PrismaErrorFilterUnknown } from './prisma-error-unknown.filter';
import { RequestLogModule } from './request_log/request_log.module';

// Hacks pro JS
/*
 * Convert all BigInt into strings just to be safe
 */
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

@Module({
    imports: [
        // ========== Core Infrastructure ==========
        ConfigModule.forRoot(),
        PrismaModule,
        RequestLogModule,
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/public',
        }),

        // ========== Common/Foundation ==========
        // Base services: Auth, Pessoa, Upload, Scheduling, etc.
        AppModuleCommon,
        CommonBaseModule,
        PessoaPrivilegioModule,

        // ========== Geographic ==========
        // Location services, geocoding, geographic search
        AppModuleGeo,

        // ========== External Integrations ==========
        // SEI, SOF, TransfereGov, etc.
        AppModuleIntegrations,

        // ========== Domain: PDM (Plano de Metas) ==========
        // Meta, Indicador, Variavel, Cronograma, Painel, etc.
        AppModulePdm,

        // ========== Domain: Projects (PP) ==========
        // Projeto, Tarefa, Portfolio, Orcamento PP, etc.
        AppModuleProjeto,

        // ========== Domain: Workflow ==========
        // Workflow configuration and execution
        AppModuleWorkflow,

        // ========== Domain: Casa Civil ==========
        // Demanda, Transferencia, DistribuicaoRecurso, Vinculo
        AppModuleCasaCivil,

        // ========== Domain: Budget (non-PP) ==========
        // Dotacao, OrcamentoPlanejado, OrcamentoRealizado
        AppModuleOrcamento,

        // ========== Cross-cutting: Reports ==========
        // All report generation modules
        AppModuleReports,

        // ========== Cross-cutting: Background Tasks ==========
        // Scheduled jobs, refresh tasks, email tasks
        AppModuleTasks,

        // ========== Supporting Features ==========
        // Notifications, search, utilities, etc.
        AppModuleSupporting,

        // ========== Analytics ==========
        DuckDBModule,
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
