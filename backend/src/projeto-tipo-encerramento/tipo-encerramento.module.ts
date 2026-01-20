import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ObraTipoEncerramentoController, ProjetoTipoEncerramentoController } from './tipo-encerramento.controller';
import { TipoEncerramentoService } from './tipo-encerramento.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProjetoTipoEncerramentoController, ObraTipoEncerramentoController],
    providers: [TipoEncerramentoService],
})
export class TipoEncerramentoModule {}
