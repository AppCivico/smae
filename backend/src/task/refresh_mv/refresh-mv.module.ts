import { Module } from '@nestjs/common';
import { RefreshMvService } from './refresh-mv.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [RefreshMvService],
    exports: [RefreshMvService],
})
export class RefreshMvModule {}
