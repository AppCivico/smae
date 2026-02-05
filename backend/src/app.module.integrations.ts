import { Module } from '@nestjs/common';
import { SeiApiModule } from './sei-api/sei-api.module';
import { SeiIntegracaoModule } from './sei-integracao/sei-integracao.module';
import { SofApiModule } from './sof-api/sof-api.module';
import { SofEntidadeModule } from './sof-entidade/sof-entidade.module';
import { TransfereGovApiModule } from './transfere-gov-api/transfere-gov-api.module';
import { TransfereGovSyncModule } from './transfere-gov-sync/transfere-gov-sync.module';

/**
 * External integrations modules aggregation
 * Consolidates all external system integration modules:
 * - SEI (Sistema Eletrônico de Informações) integration
 * - SOF (Secretaria Orçamentária e Financeira) integration
 * - TransfereGov integration
 */
@Module({
    imports: [
        SeiApiModule,
        SeiIntegracaoModule,
        SofApiModule,
        SofEntidadeModule,
        TransfereGovApiModule,
        TransfereGovSyncModule,
    ],
})
export class AppModuleIntegrations {}
