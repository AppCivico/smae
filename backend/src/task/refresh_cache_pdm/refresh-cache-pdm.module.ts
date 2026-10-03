import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RefreshCachePdmService } from './refresh-cache-pdm.service';

@Module({
    imports: [PrismaModule],
    providers: [RefreshCachePdmService],
    exports: [RefreshCachePdmService],
})
export class RefreshCachePdmModule {}
