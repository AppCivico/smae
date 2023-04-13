import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FonteRecursoController } from './fonte-recurso.controller';
import { FonteRecursoService } from './fonte-recurso.service';

@Module({
    imports: [PrismaModule],
    controllers: [FonteRecursoController],
    providers: [FonteRecursoService],
})
export class FonteRecursoModule {}
