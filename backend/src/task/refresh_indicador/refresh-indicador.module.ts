import { Module } from '@nestjs/common';
import { RefreshIndicadorService } from './refresh-indicador.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [RefreshIndicadorService],
    exports: [RefreshIndicadorService],
})
export class RefreshIndicadorModule {}
