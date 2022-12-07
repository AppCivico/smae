import { Module } from '@nestjs/common';
import { IndicadorService } from './indicador.service';
import { IndicadorController } from './indicador.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [IndicadorController],
    providers: [IndicadorService]
})
export class IndicadorModule { }
