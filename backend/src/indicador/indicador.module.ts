import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { IndicadorController } from './indicador.controller';
import { IndicadorService } from './indicador.service';
import { IndicadorFormulaCompostaService } from './indicador.formula-composta.service';

@Module({
    imports: [PrismaModule, VariavelModule],
    controllers: [IndicadorController],
    providers: [IndicadorService, IndicadorFormulaCompostaService],
})
export class IndicadorModule {}
