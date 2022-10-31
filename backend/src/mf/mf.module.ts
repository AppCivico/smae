import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MfService } from './mf.service';
// mf=monitoramento fisico
@Module({
    imports: [PrismaModule],
    providers: [MfService],
    exports: [MfService],
})
export class MfModule { }
