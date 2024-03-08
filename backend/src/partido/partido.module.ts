import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PartidoController } from './partido.controller';
import { PartidoService } from './partido.service';
import { BancadaModule } from 'src/bancada/bancada.module';

@Module({
    imports: [PrismaModule, BancadaModule],
    controllers: [PartidoController],
    providers: [PartidoService],
    exports: [PartidoService],
})
export class PartidoModule { }
