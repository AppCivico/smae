import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { DemandaConfigController } from './demanda-config.controller';
import { DemandaConfigService } from './demanda-config.service';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [DemandaConfigController],
    providers: [DemandaConfigService],
    exports: [DemandaConfigService], // For Demanda validation
})
export class DemandaConfigModule {}
