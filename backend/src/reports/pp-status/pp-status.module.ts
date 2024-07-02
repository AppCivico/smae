import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MDOStatusController, PPStatusController } from './pp-status.controller';
import { PPStatusService } from './pp-status.service';

@Module({
    imports: [PrismaModule],
    controllers: [PPStatusController, MDOStatusController],
    providers: [PPStatusService],
    exports: [PPStatusService],
})
export class PPStatusModule {}
