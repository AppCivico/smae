import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { CasaCivilAtividadesPendentesController } from './casa-civil-atividades-pendentes.controller';
import { CasaCivilAtividadesPendentesService } from './casa-civil-atividades-pendentes.service';

@Module({
    imports: [PrismaModule],
    controllers: [CasaCivilAtividadesPendentesController],
    providers: [CasaCivilAtividadesPendentesService, UtilsService],
    exports: [CasaCivilAtividadesPendentesService],
})
export class CasaCivilAtividadesPendentesModule {}
