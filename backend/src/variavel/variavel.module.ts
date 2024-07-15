import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { IndicadorVariavelPDMController, VariavelGlobalController } from './variavel.controller';
import { VariavelService } from './variavel.service';
import { VariavelFormulaCompostaController } from './variavel.formula-composta.controller';
import { VariavelFormulaCompostaService } from './variavel.formula-composta.service';
import { VariavelCalculadaService } from './variavel.calculada.service';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + 'for-variables',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [IndicadorVariavelPDMController, VariavelFormulaCompostaController, VariavelGlobalController],
    providers: [VariavelService, VariavelFormulaCompostaService, VariavelCalculadaService],
    exports: [VariavelService],
})
export class VariavelModule {}
