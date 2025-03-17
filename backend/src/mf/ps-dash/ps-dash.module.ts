import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PSMFDashboardController } from './ps-dash.controller';
import { PSMFDashboardService } from './ps-dash.service';

@Module({
    imports: [PrismaModule],
    controllers: [PSMFDashboardController],
    providers: [PSMFDashboardService],
})
export class PSMFDashboardModule {}
