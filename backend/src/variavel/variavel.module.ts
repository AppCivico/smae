import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { IndicadorVariavelPDMController, VariavelGlobalController } from './variavel.controller';
import { VariavelService } from './variavel.service';
import { VariavelFormulaCompostaController } from './variavel.formula-composta.controller';
import { VariavelFormulaCompostaService } from './variavel.formula-composta.service';
import { MetaModule } from '../meta/meta.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + 'for-variables',
            signOptions: { expiresIn: '1d' },
        }),
        forwardRef(() => MetaModule)
    ],
    controllers: [IndicadorVariavelPDMController, VariavelFormulaCompostaController, VariavelGlobalController],
    providers: [VariavelService, VariavelFormulaCompostaService],
    exports: [VariavelService],
})
export class VariavelModule {}
