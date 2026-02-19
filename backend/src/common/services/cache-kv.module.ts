import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheKVService } from './cache-kv.service';

@Module({
    imports: [PrismaModule],
    providers: [CacheKVService],
    exports: [CacheKVService],
})
export class CacheKVModule {}
