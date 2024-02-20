import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EixoController, EixoController2 } from './eixo.controller';
import { EixoService } from './eixo.service';

@Module({
    imports: [PrismaModule],
    controllers: [EixoController, EixoController2],
    providers: [EixoService],
    exports: [EixoService],
})
export class EixoModule {}
