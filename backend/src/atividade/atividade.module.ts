import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { AtividadeController } from './atividade.controller';
import { AtividadeService } from './atividade.service';

@Module({
    imports: [PrismaModule, VariavelModule],
    controllers: [AtividadeController],
    providers: [AtividadeService],
})
export class AtividadeModule {}
