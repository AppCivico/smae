import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, RouterModule } from '@nestjs/core';
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
import { PrismaModule } from './prisma/prisma.module';
import { RegiaoModule } from './regiao/regiao.module';
import { OrcamentoModule } from './reports/orcamento/orcamento.module';
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


@Module({
    imports: [
        ConfigModule.forRoot(),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/public',
        }),
        ReportsModule,
        OrcamentoModule,
        PrismaModule,
        AuthModule,

        SofApiModule,
        OrcamentoPlanejadoModule,
        DotacaoModule,
        OrcamentoRealizadoModule,
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
                children: [
                    MfMetasModule
                ]
            },
        ]),
        PdmCicloModule,
        SofEntidadeModule,
        TextoConfigModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
        {
            provide: APP_FILTER,
            useClass: ErrorFilter
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ContentInterceptor
        },
        UtilsService
    ],

})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes({
                path: '*',
                method: RequestMethod.ALL
            });
    }

}
