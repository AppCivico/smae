import { Module } from '@nestjs/common';
import { FonteRecursoService } from './fonte-recurso.service';
import { FonteRecursoController } from './fonte-recurso.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FonteRecursoController],
    providers: [FonteRecursoService]
})
export class FonteRecursoModule { }
