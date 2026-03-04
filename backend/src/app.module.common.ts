import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { FonteRecursoModule } from './fonte-recurso/fonte-recurso.module';
import { GrupoPainelExternoModule } from './grupo-panel-externo/grupo-externo.module';
import { OdsModule } from './ods/ods.module';
import { OrgaoModule } from './orgao/orgao.module';
import { PainelExternoModule } from './painel-externo/painel-externo.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { RegiaoModule } from './regiao/regiao.module';
import { TextoConfigModule } from './texto-config/texto-config.module';
import { TipoDocumentoModule } from './tipo-documento/tipo-documento.module';
import { TipoOrgaoModule } from './tipo-orgao/tipo-orgao.module';
import { UnidadeMedidaModule } from './unidade-medida/unidade-medida.module';
import { UploadModule } from './upload/upload.module';

/**
 * Common/Core modules aggregation
 * Provides foundational services used across the application:
 * - Authentication and authorization (AuthModule)
 * - User management (PessoaModule)
 * - Organization management (OrgaoModule)
 * - File upload (UploadModule)
 * - Scheduling infrastructure
 * - Reference data (Ods, FonteRecurso, etc.)
 * 
 * Note: Geographic modules moved to AppModuleGeo
 *       Integration modules moved to AppModuleIntegrations
 *       PDM thematic modules moved to AppModulePdm
 */
@Module({
    imports: [
        AuthModule,
        ScheduleModule.forRoot(),
        PessoaModule,
        OrgaoModule,
        TipoOrgaoModule,
        OdsModule,
        FonteRecursoModule,
        TipoDocumentoModule,
        RegiaoModule,
        UploadModule,
        UnidadeMedidaModule,
        TextoConfigModule,
        FeatureFlagModule,
        GrupoPainelExternoModule,
        PainelExternoModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModuleCommon {}
