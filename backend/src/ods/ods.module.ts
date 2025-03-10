import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OdsController } from './ods.controller';
import { OdsService } from './ods.service';

@Module({
    imports: [PrismaModule],
    controllers: [OdsController],
    providers: [OdsService],
})
export class OdsModule {}
