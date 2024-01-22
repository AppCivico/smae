import { Module } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagController } from './feature-flag.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FeatureFlagController],
    providers: [FeatureFlagService],
    exports: [FeatureFlagService],
})
export class FeatureFlagModule {}
