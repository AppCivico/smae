import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjetoAssuntoVariavelController } from './assunto-variavel.controller';
import { ProjetoAssuntoVariavelService } from './assunto-variavel.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProjetoAssuntoVariavelController],
    providers: [ProjetoAssuntoVariavelService],
})
export class ProjetoAssuntoVariavelModule {}
