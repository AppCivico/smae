import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { IniciativaController } from './iniciativa.controller';
import { IniciativaService } from './iniciativa.service';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';

@Module({
    imports: [PrismaModule, VariavelModule, CronogramaEtapaModule],
    controllers: [IniciativaController],
    providers: [IniciativaService, CronogramaEtapaService],
})
export class IniciativaModule {}
