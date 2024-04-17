import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RefreshTransferenciaService } from './refresh-transferencia.service';

@Module({
    imports: [PrismaModule],
    providers: [RefreshTransferenciaService],
    exports: [RefreshTransferenciaService],
})
export class RefreshTransferenciaModule {}
