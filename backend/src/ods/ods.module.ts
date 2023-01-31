import { Module } from '@nestjs/common';
import { OdsService } from './ods.service';
import { OdsController } from './ods.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [OdsController],
    providers: [OdsService],
})
export class OdsModule {}
