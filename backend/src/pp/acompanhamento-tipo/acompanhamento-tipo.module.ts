import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AcompanhamentoTipoController } from './acompanhamento-tipo.controller';
import { AcompanhamentoTipoService } from './acompanhamento-tipo.service';

@Module({
    imports: [PrismaModule],
    controllers: [AcompanhamentoTipoController],
    providers: [AcompanhamentoTipoService],
})
export class AcompanhamentoTipoModule {}
