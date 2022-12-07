import { Module } from '@nestjs/common';
import { PdmService } from './pdm.service';
import { PdmController } from './pdm.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { ObjetivoEstrategicoService } from '../objetivo-estrategico/objetivo-estrategico.service';
import { EixoService } from '../eixo/eixo.service';
import { MetaService } from '../meta/meta.service';
import { TagService } from '../tag/tag.service';
import { SubTemaService } from '../subtema/subtema.service';

@Module({
    imports: [
        PrismaModule,
        UploadModule
    ],
    controllers: [PdmController],
    providers: [
        PdmService,
        ObjetivoEstrategicoService,
        SubTemaService,
        EixoService,
        TagService
    ]
})
export class PdmModule { }
