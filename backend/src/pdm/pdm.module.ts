import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { VariavelService } from 'src/variavel/variavel.service';
import { EixoService } from '../eixo/eixo.service';
import { ObjetivoEstrategicoService } from '../objetivo-estrategico/objetivo-estrategico.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubTemaService } from '../subtema/subtema.service';
import { TagService } from '../tag/tag.service';
import { UploadModule } from '../upload/upload.module';
import { PdmController } from './pdm.controller';
import { PdmService } from './pdm.service';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [PdmController],
    providers: [PdmService, ObjetivoEstrategicoService, SubTemaService, EixoService, TagService, VariavelService, JwtService],
})
export class PdmModule {}
