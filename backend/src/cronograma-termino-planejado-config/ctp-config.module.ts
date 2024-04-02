import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CTPConfigController } from './ctp-config.controller';
import { CTPConfigService } from './ctp-config.service';

@Module({
    imports: [PrismaModule],
    controllers: [CTPConfigController],
    providers: [CTPConfigService],
})
export class CTPConfigModule {}
