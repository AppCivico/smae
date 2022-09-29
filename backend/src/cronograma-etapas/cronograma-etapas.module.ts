import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CronogramaEtapaController } from './cronograma-etapas.controller';
import { CronogramaEtapaService } from './cronograma-etapas.service';

@Module({
    imports: [PrismaModule],
    controllers: [CronogramaEtapaController],
    providers: [CronogramaEtapaService]
})
export class CronogramaEtapaModule { }
