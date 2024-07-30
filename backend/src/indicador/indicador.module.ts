import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { IndicadorController, IndicadorPSController } from './indicador.controller';
import { IndicadorService } from './indicador.service';
import { IndicadorFormulaCompostaService } from './indicador.formula-composta.service';
import { MetaModule } from '../meta/meta.module';

@Module({
    imports: [PrismaModule, VariavelModule, MetaModule],
    controllers: [IndicadorController, IndicadorPSController],
    providers: [IndicadorService, IndicadorFormulaCompostaService],
})
export class IndicadorModule {}
