import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjetoEtapaController } from './projeto-etapa.controller';
import { ProjetoEtapaService } from './projeto-etapa.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProjetoEtapaController],
    providers: [ProjetoEtapaService],
    exports: [ProjetoEtapaService],
})
export class ProjetoEtapaModule {}
