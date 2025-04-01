import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AssuntoVariavelModule } from './assunto-variavel/assunto-variavel.module';
import { AtividadeModule } from './atividade/atividade.module';
import { CronogramaEtapaModule } from './cronograma-etapas/cronograma-etapas.module';
import { CronogramaModule } from './cronograma/cronograma.module';
import { EquipeRespModule } from './equipe-resp/equipe-resp.module';
import { EtapaModule } from './etapa/etapa.module';
import { FonteVariavelModule } from './fonte-variavel/fonte-variavel.module';
import { GrupoPaineisModule } from './grupo-paineis/grupo-paineis.module';
import { IndicadorModule } from './indicador/indicador.module';
import { IniciativaModule } from './iniciativa/iniciativa.module';
import { MetaOrcamentoModule } from './meta-orcamento/meta-orcamento.module';
import { MetaModule } from './meta/meta.module';
import { MonitMetasModule as MfMetasModule } from './mf/metas/metas.module';
import { MfModule } from './mf/mf.module';
import { PainelModule } from './painel/painel.module';
import { PdmCicloModule } from './pdm-ciclo/pdm-ciclo.module';
import { PdmModule } from './pdm/pdm.module';
import { IndicadoresModule } from './reports/indicadores/indicadores.module';
import { MonitoramentoMensalModule } from './reports/monitoramento-mensal/monitoramento-mensal.module';
import { VariavelCategoricaModule } from './variavel-categorica/variavel-categorica.module';
import { VariavelModule } from './variavel/variavel.module';

@Module({
    imports: [
        PdmModule,
        MetaOrcamentoModule,
        MetaModule,
        IndicadorModule,
        IniciativaModule,
        AtividadeModule,
        VariavelModule,
        CronogramaEtapaModule,
        CronogramaModule,
        EtapaModule,
        PainelModule,
        MfMetasModule,
        GrupoPaineisModule,
        FonteVariavelModule,
        AssuntoVariavelModule,
        RouterModule.register([
            {
                path: 'mf',
                module: MfModule,
                children: [MfMetasModule],
            },
        ]),
        PdmCicloModule,
        IndicadoresModule,
        MonitoramentoMensalModule,
        VariavelCategoricaModule,
        EquipeRespModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModulePdm {}
