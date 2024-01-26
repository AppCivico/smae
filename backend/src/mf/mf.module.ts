import { Module } from '@nestjs/common';
import { MetaModule } from '../meta/meta.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuxiliarModule } from './auxiliar/auxiliar.module';
import { MfService } from './mf.service';
// mf=monitoramento fisico
@Module({
    imports: [PrismaModule, AuxiliarModule, MetaModule],
    providers: [MfService],
    exports: [MfService],
})
export class MfModule {}
