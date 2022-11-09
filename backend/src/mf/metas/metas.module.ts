import { Module } from '@nestjs/common';
import { MetasAnaliseQualiController } from 'src/mf/metas/metas-analise-quali.controller';
import { MetasAnaliseQualiService } from 'src/mf/metas/metas-analise-quali.service';
import { MetasRiscoController } from 'src/mf/metas/metas-risco.controller';
import { MetasRiscoService } from 'src/mf/metas/metas-risco.service';
import { MetasController } from 'src/mf/metas/metas.controller';
import { MetasService } from 'src/mf/metas/metas.service';
import { MfModule } from 'src/mf/mf.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { VariavelModule } from 'src/variavel/variavel.module';

@Module({
    imports: [PrismaModule, MfModule, VariavelModule, UploadModule],
    controllers: [MetasController, MetasAnaliseQualiController, MetasRiscoController],
    providers: [MetasService, MetasAnaliseQualiService, MetasRiscoService]
})
export class MetasModule { }
