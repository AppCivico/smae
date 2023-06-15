import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageService } from './storage-service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET,
            signOptions: {},
        }),
    ],
    controllers: [UploadController],
    providers: [UploadService, StorageService],
    exports: [UploadService],
})
export class UploadModule { }