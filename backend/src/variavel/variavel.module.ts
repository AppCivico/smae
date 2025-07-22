import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { IndicadorVariavelPDMController, VariavelGlobalController } from './variavel.controller';
import { VariavelService } from './variavel.service';
import { VariavelFormulaCompostaController, VariavelGlobalFCController } from './variavel.formula-composta.controller';
import { VariavelFormulaCompostaService } from './variavel.formula-composta.service';
import { VariavelCalculadaService } from './variavel.calculada.service';
import { MetaModule } from '../meta/meta.module';
import { IndicadorModule } from '../indicador/indicador.module';
import { VariavelCicloGlobalController } from './variavel.ciclo.controller';
import { VariavelCicloService } from './variavel.ciclo.service';
import { PdmModule } from '../pdm/pdm.module';
import { UploadModule } from '../upload/upload.module';
import { VariavelUtilService } from './variavel.util.service';
import { VariavelCategoricaModule } from '../variavel-categorica/variavel-categorica.module';
import { VariavelRelacionamentoService } from './relacionados/variavel.relacionamento.service';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + 'for-variables',
            signOptions: { expiresIn: '1d' },
        }),
        forwardRef(() => MetaModule),
        forwardRef(() => IndicadorModule),
        forwardRef(() => PdmModule),
        VariavelCategoricaModule,
        UploadModule,
    ],
    controllers: [
        IndicadorVariavelPDMController,
        VariavelFormulaCompostaController,
        VariavelGlobalController,
        VariavelGlobalFCController,
        VariavelCicloGlobalController,
    ],
    providers: [
        VariavelService,
        VariavelFormulaCompostaService,
        VariavelCalculadaService,
        VariavelCicloService,
        VariavelUtilService,
        VariavelRelacionamentoService
    ],
    exports: [VariavelService],
})
export class VariavelModule {}
