import { Global, Module } from '@nestjs/common';
import { EmailConfigService, SmaeConfigService, SysadminService } from './smae-config.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailConfigController, SmaeConfigController, SysadminController } from './smae-config.controller';
import { ThumbnailConfigController } from './thumbnail-config.controller';

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [SmaeConfigController, EmailConfigController, SysadminController, ThumbnailConfigController],
    providers: [SmaeConfigService, EmailConfigService, SysadminService],
    exports: [SmaeConfigService],
})
export class SmaeConfigModule {}
