import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { IndicadorController } from './indicador.controller';
import { IndicadorService } from './indicador.service';

@Module({
    imports: [PrismaModule, VariavelModule],
    controllers: [IndicadorController],
    providers: [IndicadorService],
})
export class IndicadorModule {}
