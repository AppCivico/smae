import { Module } from '@nestjs/common';
import { PdmService } from './pdm.service';
import { PdmController } from './pdm.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { ObjetivoEstrategicoService } from 'src/objetivo-estrategico/objetivo-estrategico.service';
import { EixoService } from 'src/eixo/eixo.service';
import { MetaService } from 'src/meta/meta.service';
import { TagService } from 'src/tag/tag.service';
import { SubTemaService } from 'src/subtema/subtema.service';

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
        MetaService,
        TagService
    ]
})
export class PdmModule { }
