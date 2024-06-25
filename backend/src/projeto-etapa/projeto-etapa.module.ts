import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjetoEtapaController, ProjetoEtapaMDOController } from './projeto-etapa.controller';
import { ProjetoEtapaService } from './projeto-etapa.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProjetoEtapaController, ProjetoEtapaMDOController],
    providers: [ProjetoEtapaService],
    exports: [ProjetoEtapaService],
})
export class ProjetoEtapaModule {}
