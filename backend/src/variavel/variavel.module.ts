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

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + 'for-variables',
            signOptions: { expiresIn: '1d' },
        }),
        forwardRef(() => MetaModule),
        forwardRef(() => IndicadorModule),
    ],
    controllers: [
        IndicadorVariavelPDMController,
        VariavelFormulaCompostaController,
        VariavelGlobalController,
        VariavelGlobalFCController,
    ],
    providers: [VariavelService, VariavelFormulaCompostaService, VariavelCalculadaService],
    exports: [VariavelService],
})
export class VariavelModule {}
