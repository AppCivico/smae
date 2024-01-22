import { MiddlewareConsumer, Module, NestModule, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, RouterModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AtividadeModule } from './atividade/atividade.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ContentInterceptor } from './content.interceptor';
import { CronogramaEtapaModule } from './cronograma-etapas/cronograma-etapas.module';
import { CronogramaModule } from './cronograma/cronograma.module';
import { DotacaoModule } from './dotacao/dotacao.module';
import { EixoModule } from './eixo/eixo.module';
import { ErrorFilter } from './error.filter';
import { EtapaModule } from './etapa/etapa.module';
import { FonteRecursoModule } from './fonte-recurso/fonte-recurso.module';
import { GrupoPaineisModule } from './grupo-paineis/grupo-paineis.module';
import { IndicadorModule } from './indicador/indicador.module';
import { IniciativaModule } from './iniciativa/iniciativa.module';
import { MetaOrcamentoModule } from './meta-orcamento/meta-orcamento.module';
import { MetaModule } from './meta/meta.module';
import { MetasModule as MfMetasModule } from './mf/metas/metas.module';
import { MfModule } from './mf/mf.module';
import { MinhaContaModule } from './minha-conta/minha-conta.module';
import { ObjetivoEstrategicoModule } from './objetivo-estrategico/objetivo-estrategico.module';
import { OdsModule } from './ods/ods.module';
import { OrcamentoPlanejadoModule } from './orcamento-planejado/orcamento-planejado.module';
import { OrcamentoRealizadoModule } from './orcamento-realizado/orcamento-realizado.module';
import { OrgaoModule } from './orgao/orgao.module';
import { PainelModule } from './painel/painel.module';
import { PdmCicloModule } from './pdm-ciclo/pdm-ciclo.module';
import { PdmModule } from './pdm/pdm.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { AcompanhamentoModule } from './pp/acompanhamento/acompanhamento.module';
import { LicoesAprendidasModule } from './pp/licoes-aprendidas/licoes-aprendidas.module';
import { PlanoAcaoMonitoramentoModule } from './pp/plano-acao-monitoramento/plano-acao-monitoramento.module';
import { PlanoAcaoModule } from './pp/plano-de-acao/plano-de-acao.module';
import { PortfolioModule } from './pp/portfolio/portfolio.module';
import { AcaoModule } from './pp/projeto/acao/acao.module';
import { ProjetoModule } from './pp/projeto/projeto.module';
import { RiscoModule } from './pp/risco/risco.module';
import { TarefaModule } from './pp/tarefa/tarefa.module';
import { PrismaModule } from './prisma/prisma.module';
import { RegiaoModule } from './regiao/regiao.module';
import { IndicadoresModule } from './reports/indicadores/indicadores.module';
import { MonitoramentoMensalModule } from './reports/monitoramento-mensal/monitoramento-mensal.module';
import { OrcamentoModule } from './reports/orcamento/orcamento.module';
import { PPProjetoModule } from './reports/pp-projeto/pp-projeto.module';
import { ReportsModule } from './reports/relatorios/reports.module';
import { UtilsService } from './reports/utils/utils.service';
import { SofApiModule } from './sof-api/sof-api.module';
import { SofEntidadeModule } from './sof-entidade/sof-entidade.module';
import { SubTemaModule } from './subtema/subtema.module';
import { TagModule } from './tag/tag.module';
import { TextoConfigModule } from './texto-config/texto-config.module';
import { TipoDocumentoModule } from './tipo-documento/tipo-documento.module';
import { TipoOrgaoModule } from './tipo-orgao/tipo-orgao.module';
import { UnidadeMedidaModule } from './unidade-medida/unidade-medida.module';
import { UploadModule } from './upload/upload.module';
import { VariavelModule } from './variavel/variavel.module';
import { GraphvizModule } from './graphviz/graphviz.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrcamentoPrevistoModule } from './pp/orcamento-previsto/orcamento-previsto.module';
import { OrcamentoPlanejadoModule as PPOrcamentoPlanejadoModule } from './pp/orcamento-planejado/orcamento-planejado.module';
import { OrcamentoRealizadoModule as PPOrcamentoRealizadoModule } from './pp/orcamento-realizado/orcamento-realizado.module';
import { ProjetoPrevisaoCustoModule } from './reports/projeto-previsao-custo/projeto-previsao-custo.module';
import { ProjetoOrcamentoModule } from './reports/projeto-orcamento/projeto-orcamento.module';
import { ImportacaoOrcamentoModule } from './importacao-orcamento/importacao-orcamento.module';
import { TrimPipe } from './common/pipes/trim-pipe';
import { AcompanhamentoTipoModule } from './pp/acompanhamento-tipo/acompanhamento-tipo.module';
import { RequestLogModule } from './request_log/request_log.module';
import { GrupoPortfolioModule } from './pp/grupo-portfolio/grupo-portfolio.module';

// Hacks pro JS
/*
 * Convert all BigInt into strings just to be safe
 */
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};
import { TaskModule } from './task/task.module';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/public',
        }),
        PrismaModule,
        PortfolioModule,
        ProjetoModule,

        AuthModule,
        ReportsModule,
        OrcamentoModule,
        SofApiModule,
        OrcamentoPlanejadoModule,
        DotacaoModule,
        OrcamentoRealizadoModule,
        PPOrcamentoRealizadoModule,
        MetaOrcamentoModule,
        PessoaModule,
        MinhaContaModule,
        OrgaoModule,
        TipoOrgaoModule,
        OdsModule,
        EixoModule,
        PdmModule,
        FonteRecursoModule,
        TipoDocumentoModule,
        TagModule,
        ObjetivoEstrategicoModule,
        RegiaoModule,
        UploadModule,
        SubTemaModule,
        MetaModule,
        IndicadorModule,
        UnidadeMedidaModule,
        IniciativaModule,
        AtividadeModule,
        VariavelModule,
        CronogramaModule,
        EtapaModule,
        CronogramaEtapaModule,
        PainelModule,
        ScheduleModule.forRoot(),
        MfMetasModule,
        GrupoPaineisModule,
        RouterModule.register([
            {
                path: 'mf',
                module: MfModule,
                children: [MfMetasModule],
            },
        ]),
        PdmCicloModule,
        SofEntidadeModule,
        TextoConfigModule,
        IndicadoresModule,
        MonitoramentoMensalModule,
        PPProjetoModule,
        AcaoModule,
        TarefaModule,
        RiscoModule,
        PlanoAcaoModule,
        PlanoAcaoMonitoramentoModule,
        AcompanhamentoModule,
        LicoesAprendidasModule,
        GraphvizModule,
        DashboardModule,
        OrcamentoPrevistoModule,
        PPOrcamentoPlanejadoModule,
        ProjetoPrevisaoCustoModule,
        ProjetoOrcamentoModule,
        ImportacaoOrcamentoModule, // carregar depois do OrcamentoPrevistoModule
        AcompanhamentoTipoModule,
        RequestLogModule,
        GrupoPortfolioModule,
        TaskModule,
        FeatureFlagModule,
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
