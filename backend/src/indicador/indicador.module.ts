import { Module } from '@nestjs/common';
import { IndicadorService } from './indicador.service';
import { IndicadorController } from './indicador.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';

@Module({
    imports: [PrismaModule, VariavelModule],
    controllers: [IndicadorController],
    providers: [IndicadorService],
})
export class IndicadorModule {}
