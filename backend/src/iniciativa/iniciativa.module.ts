import { Module } from '@nestjs/common';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { MetaModule } from '../meta/meta.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { IniciativaController, IniciativaSetorialController } from './iniciativa.controller';
import { IniciativaService } from './iniciativa.service';

@Module({
    imports: [PrismaModule, MetaModule, VariavelModule],
    controllers: [IniciativaController, IniciativaSetorialController],
    providers: [IniciativaService, CronogramaEtapaService],
})
export class IniciativaModule {}
