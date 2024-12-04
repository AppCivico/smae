import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriaAssuntoVariavelController } from './categoria-assunto-variavel.controller';
import { CategoriaAssuntoVariavelService } from './categoria-assunto-variavel.service';

@Module({
    imports: [PrismaModule],
    controllers: [CategoriaAssuntoVariavelController],
    providers: [CategoriaAssuntoVariavelService],
})
export class CategoriaAssuntoVariavelModule {}
