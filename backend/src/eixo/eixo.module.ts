import { Module } from '@nestjs/common';
import { EixoService } from './eixo.service';
import { EixoController, EixoController2 } from './eixo.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EixoController, EixoController2],
    providers: [EixoService],
})
export class EixoModule {}
