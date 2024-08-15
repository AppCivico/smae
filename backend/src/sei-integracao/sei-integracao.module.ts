import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SeiApiModule } from '../sei-api/sei-api.module';
import { SeiIntegracaoController } from './sei-integracao.controller';
import { SeiIntegracaoService } from './sei-integracao.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
        SeiApiModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [SeiIntegracaoController],
    providers: [SeiIntegracaoService],
    exports: [SeiIntegracaoService],
})
export class SeiIntegracaoModule {}
