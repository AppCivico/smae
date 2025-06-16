import { Global, Module } from '@nestjs/common';
import { EmailConfigService, SmaeConfigService } from './smae-config.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailConfigController } from './smae-config.controller';

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [EmailConfigController],
    providers: [SmaeConfigService, EmailConfigService],
    exports: [SmaeConfigService],
})
export class SmaeConfigModule {}
