import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MfService } from './mf.service';
import { UtilitarioModule } from './utilitario/utilitario.module';
// mf=monitoramento fisico
@Module({
    imports: [PrismaModule, UtilitarioModule],
    providers: [MfService],
    exports: [MfService],
})
export class MfModule {}
