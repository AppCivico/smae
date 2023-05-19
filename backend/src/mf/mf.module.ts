import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MfService } from './mf.service';
import { AuxiliarModule } from './auxiliar/auxiliar.module';
// mf=monitoramento fisico
@Module({
    imports: [PrismaModule, AuxiliarModule],
    providers: [MfService],
    exports: [MfService],
})
export class MfModule {}
