import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { EixoModule } from './eixo/eixo.module';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { FonteRecursoModule } from './fonte-recurso/fonte-recurso.module';
import { GeoApiModule } from './geo-api/geo-api.module';
import { GeoLocModule } from './geo-loc/geo-loc.module';
import { ObjetivoEstrategicoModule } from './objetivo-estrategico/objetivo-estrategico.module';
import { OdsModule } from './ods/ods.module';
import { OrgaoModule } from './orgao/orgao.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { RegiaoModule } from './regiao/regiao.module';
import { SofApiModule } from './sof-api/sof-api.module';
import { SofEntidadeModule } from './sof-entidade/sof-entidade.module';
import { SubTemaModule } from './subtema/subtema.module';
import { TagModule } from './tag/tag.module';
import { TaskModule } from './task/task.module';
import { TextoConfigModule } from './texto-config/texto-config.module';
import { TipoDocumentoModule } from './tipo-documento/tipo-documento.module';
import { TipoOrgaoModule } from './tipo-orgao/tipo-orgao.module';
import { UnidadeMedidaModule } from './unidade-medida/unidade-medida.module';
import { UploadModule } from './upload/upload.module';
import { GrupoPainelExternoModule } from './grupo-panel-externo/grupo-externo.module';

@Module({
    imports: [
        AuthModule,
        GeoLocModule,
        ScheduleModule.forRoot(),
        TaskModule,
        SofApiModule,
        SofEntidadeModule,
        PessoaModule,
        OrgaoModule,
        TipoOrgaoModule,
        OdsModule,
        EixoModule,
        TagModule,
        FonteRecursoModule,
        TipoDocumentoModule,
        ObjetivoEstrategicoModule,
        RegiaoModule,
        UploadModule,
        SubTemaModule,
        UnidadeMedidaModule,
        TextoConfigModule,
        FeatureFlagModule,
        GeoApiModule,
        GrupoPainelExternoModule
    ],
    controllers: [],
    providers: [],
})
export class AppModuleCommon {}
