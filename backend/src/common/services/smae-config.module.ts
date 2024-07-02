import { Module } from '@nestjs/common';
import { SmaeConfigService } from './smae-config.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [SmaeConfigService],
    exports: [SmaeConfigService],
})
export class SmaeConfigModule {}
