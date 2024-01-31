import { Module } from '@nestjs/common';
import { RefreshMetaService } from './refresh-meta.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [RefreshMetaService],
    exports: [RefreshMetaService],
})
export class RefreshMetaModule {}
