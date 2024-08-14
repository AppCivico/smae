import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SeiApiModule } from '../sei-api/sof-api.module';
import { SeiIntegracaoController } from './sei-integracao.controller';
import { SeiIntegracaoService } from './sei-integracao.service';

@Module({
    imports: [PrismaModule, SeiApiModule],
    controllers: [SeiIntegracaoController],
    providers: [SeiIntegracaoService],
    exports: [SeiIntegracaoService],
})
export class SeiIntegracaoModule {}
