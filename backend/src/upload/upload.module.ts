import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageService } from './storage-service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET,
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [UploadController],
    providers: [UploadService, StorageService],
    exports: [UploadService]
})
export class UploadModule { }
