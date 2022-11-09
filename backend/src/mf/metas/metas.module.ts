import { Module } from '@nestjs/common';
import { MetasService } from './metas.service';
import { MetasController } from './metas.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MfModule } from '../mf.module';
import { VariavelModule } from 'src/variavel/variavel.module';
import { UploadModule } from 'src/upload/upload.module';
import { MetasControllerAnaliseQuali } from 'src/mf/metas/metas-analise-quali.controller';
import { MetasAnaliseQualiService } from 'src/mf/metas/metas-analise-quali.service';

@Module({
    imports: [PrismaModule, MfModule, VariavelModule, UploadModule],
    controllers: [MetasController, MetasControllerAnaliseQuali],
    providers: [MetasService, MetasAnaliseQualiService]
})
export class MetasModule { }
