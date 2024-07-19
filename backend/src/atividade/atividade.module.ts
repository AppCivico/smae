import { Module } from '@nestjs/common';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { MetaModule } from '../meta/meta.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { AtividadeController } from './atividade.controller';
import { AtividadeService } from './atividade.service';

@Module({
    imports: [PrismaModule, MetaModule, VariavelModule, ],
    controllers: [AtividadeController],
    providers: [AtividadeService, CronogramaEtapaService],
})
export class AtividadeModule {}
