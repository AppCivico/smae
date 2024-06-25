import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AcompanhamentoTipoController, AcompanhamentoTipoMDOController } from './acompanhamento-tipo.controller';
import { AcompanhamentoTipoService } from './acompanhamento-tipo.service';

@Module({
    imports: [PrismaModule],
    controllers: [AcompanhamentoTipoController, AcompanhamentoTipoMDOController],
    providers: [AcompanhamentoTipoService],
})
export class AcompanhamentoTipoModule {}
