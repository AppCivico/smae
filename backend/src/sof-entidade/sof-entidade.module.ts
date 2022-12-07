import { Module } from '@nestjs/common';
import { SofEntidadeService } from './sof-entidade.service';
import { SofEntidadeController } from './sof-entidade.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SofEntidadeController],
    providers: [SofEntidadeService]
})
export class SofEntidadeModule { }
