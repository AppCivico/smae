import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { IndicadorController, IndicadorPSController } from './indicador.controller';
import { IndicadorService } from './indicador.service';
import { IndicadorFormulaCompostaService } from './indicador.formula-composta.service';
import { MetaModule } from '../meta/meta.module';

@Module({
    imports: [PrismaModule, forwardRef(() => VariavelModule), forwardRef(() => MetaModule)],
    controllers: [IndicadorController, IndicadorPSController],
    providers: [IndicadorService, IndicadorFormulaCompostaService],
    exports: [IndicadorFormulaCompostaService],
})
export class IndicadorModule {}
