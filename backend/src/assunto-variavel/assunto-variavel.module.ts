import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AssuntoVariavelController } from './assunto-variavel.controller';
import { AssuntoVariavelService } from './assunto-variavel.service';

@Module({
    imports: [PrismaModule],
    controllers: [AssuntoVariavelController],
    providers: [AssuntoVariavelService],
})
export class AssuntoVariavelModule {}
