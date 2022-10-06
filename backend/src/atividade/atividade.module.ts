import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VariavelModule } from 'src/variavel/variavel.module';
import { AtividadeController } from './atividade.controller';
import { AtividadeService } from './atividade.service';

@Module({
    imports: [PrismaModule, VariavelModule],
    controllers: [AtividadeController],
    providers: [AtividadeService],
})
export class AtividadeModule { }
