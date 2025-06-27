import { Module } from '@nestjs/common';
import { SmaeConfigController } from './smae-config.controller';
import { SmaeConfigService } from './smae-config.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SmaeConfigController],
  providers: [SmaeConfigService, PrismaService],
})
export class SmaeConfigModule {}
