import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { DemandaModule } from '../demanda.module';
import { DemandaAcaoController } from './acao.controller';
import { DemandaAcaoService } from './acao.service';

@Module({
    imports: [PrismaModule, forwardRef(() => DemandaModule)],
    controllers: [DemandaAcaoController],
    providers: [DemandaAcaoService],
    exports: [DemandaAcaoService],
})
export class DemandaAcaoModule {}
