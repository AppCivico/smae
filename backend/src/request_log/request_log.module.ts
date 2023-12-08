import { Module } from '@nestjs/common';
import { RequestLogService } from './request_log.service';
import { RequestLogController } from './request_log.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [RequestLogController],
    providers: [RequestLogService],
})
export class RequestLogModule {}
