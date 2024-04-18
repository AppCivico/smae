import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DashTransferenciaController } from './transferencia.controller';
import { DashTransferenciaService } from './transferencia.service';

@Module({
    imports: [PrismaModule],
    controllers: [DashTransferenciaController],
    providers: [DashTransferenciaService],
})
export class DashTransferenciaModule {}
