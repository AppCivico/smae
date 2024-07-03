import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FonteVariavelController } from './fonte-variavel.controller';
import { FonteVariavelService } from './fonte-variavel.service';

@Module({
    imports: [PrismaModule],
    controllers: [FonteVariavelController],
    providers: [FonteVariavelService],
})
export class FonteVariavelModule {}
