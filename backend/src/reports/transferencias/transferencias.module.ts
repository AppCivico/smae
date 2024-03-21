import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransferenciasController } from './transferencias.controller';
import { TransferenciasService } from './transferencias.service';

@Module({
    imports: [PrismaModule],
    controllers: [TransferenciasController],
    providers: [TransferenciasService],
    exports: [TransferenciasService],
})
export class TransferenciasModule {}
