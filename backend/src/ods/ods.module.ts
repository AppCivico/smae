import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OdsController, OdsPSController } from './ods.controller';
import { OdsService } from './ods.service';

@Module({
    imports: [PrismaModule],
    controllers: [OdsController, OdsPSController],
    providers: [OdsService],
})
export class OdsModule {}
