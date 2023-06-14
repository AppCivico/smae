import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { AtividadeController } from './atividade.controller';
import { AtividadeService } from './atividade.service';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';

@Module({
    imports: [PrismaModule, VariavelModule, CronogramaEtapaModule],
    controllers: [AtividadeController],
    providers: [AtividadeService, CronogramaEtapaService],
})
export class AtividadeModule {}
