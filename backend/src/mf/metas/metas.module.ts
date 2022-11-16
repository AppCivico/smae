import { Module } from '@nestjs/common';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { CronogramaModule } from 'src/cronograma/cronograma.module';
import { CronogramaService } from 'src/cronograma/cronograma.service';
import { EtapaModule } from 'src/etapa/etapa.module';
import { MetasAnaliseQualiController } from 'src/mf/metas/metas-analise-quali.controller';
import { MetasAnaliseQualiService } from 'src/mf/metas/metas-analise-quali.service';
import { MetasCronogramaController } from 'src/mf/metas/metas-cronogramas.controller';
import { MetasFechamentoController } from 'src/mf/metas/metas-fechamento.controller';
import { MetasFechamentoService } from 'src/mf/metas/metas-fechamento.service';
import { MetasRiscoController } from 'src/mf/metas/metas-risco.controller';
import { MetasRiscoService } from 'src/mf/metas/metas-risco.service';
import { MetasController } from 'src/mf/metas/metas.controller';
import { MetasService } from 'src/mf/metas/metas.service';
import { MfModule } from 'src/mf/mf.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { VariavelModule } from 'src/variavel/variavel.module';

@Module({
    imports: [PrismaModule, MfModule, VariavelModule, UploadModule, CronogramaModule, CronogramaEtapaModule, EtapaModule],
    controllers: [
        MetasController,
        MetasAnaliseQualiController,
        MetasRiscoController,
        MetasFechamentoController,
        MetasCronogramaController
    ],
    providers: [
        MetasService,
        MetasAnaliseQualiService,
        MetasRiscoService,
        MetasFechamentoService,
        CronogramaService,
        CronogramaEtapaService,

    ]
})
export class MetasModule { }
