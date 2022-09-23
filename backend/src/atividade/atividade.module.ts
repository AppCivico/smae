import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AtividadeController } from './atividade.controller';
import { AtividadeService } from './atividade.service';

@Module({
    imports: [PrismaModule],
    controllers: [AtividadeController],
    providers: [AtividadeService]
})
export class AtividadeModule { }
