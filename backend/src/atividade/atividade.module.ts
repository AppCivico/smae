import { Module } from '@nestjs/common';
import { MetaModule } from '../meta/meta.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { AtividadeController, AtividadeSetorialController } from './atividade.controller';
import { AtividadeService } from './atividade.service';

@Module({
    imports: [PrismaModule, MetaModule, VariavelModule],
    controllers: [AtividadeController, AtividadeSetorialController],
    providers: [AtividadeService],
})
export class AtividadeModule {}
