import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PSMFDashboardController } from './ps-dash.controller';
import { PSMFDashboardService } from './ps-dash.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [PSMFDashboardController],
    providers: [PSMFDashboardService],
})
export class PSMFDashboardModule {}
