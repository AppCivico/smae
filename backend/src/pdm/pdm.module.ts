import { Module } from '@nestjs/common';
import { EixoModule } from '../eixo/eixo.module';
import { ObjetivoEstrategicoModule } from '../objetivo-estrategico/objetivo-estrategico.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SubTemaModule } from '../subtema/subtema.module';
import { TagModule } from '../tag/tag.module';
import { UploadModule } from '../upload/upload.module';
import { VariavelModule } from '../variavel/variavel.module';
import { PdmController } from './pdm.controller';
import { PdmService } from './pdm.service';

@Module({
    imports: [
        PrismaModule,
        SubTemaModule,
        EixoModule,
        TagModule,
        ObjetivoEstrategicoModule,
        VariavelModule,
        UploadModule,
    ],
    controllers: [PdmController],
    providers: [PdmService],
})
export class PdmModule {}
