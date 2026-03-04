import { Global, Module } from '@nestjs/common';
import { EmailConfigService, SmaeConfigService } from './smae-config.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailConfigController, SmaeConfigController } from './smae-config.controller';
import { ThumbnailConfigController } from './thumbnail-config.controller';

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [SmaeConfigController, EmailConfigController, ThumbnailConfigController],
    providers: [SmaeConfigService, EmailConfigService],
    exports: [SmaeConfigService],
})
export class SmaeConfigModule {}
