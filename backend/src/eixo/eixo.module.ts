import { Module } from '@nestjs/common';
import { EixoService } from './eixo.service';
import { EixoController } from './eixo.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EixoController],
    providers: [EixoService]
})
export class EixoModule { }
