import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BancadaController } from './bancada.controller';
import { BancadaService } from './bancada.service';
import { PartidoModule } from 'src/partido/partido.module';

@Module({
    imports: [PrismaModule, PartidoModule],
    controllers: [BancadaController],
    providers: [BancadaService],
    exports: [BancadaService],
})
export class BancadaModule {}
