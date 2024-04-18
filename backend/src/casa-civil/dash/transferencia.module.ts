import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DashTransferenciaController } from './transferencia.controller';
import { DashTransferenciaService } from './transferencia.service';
import { TransferenciaModule } from '../transferencia/transferencia.module';

@Module({
    imports: [PrismaModule, TransferenciaModule],
    controllers: [DashTransferenciaController],
    providers: [DashTransferenciaService],
})
export class DashTransferenciaModule {}
