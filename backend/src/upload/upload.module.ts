import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorageService } from 'src/upload/storage-service';
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
    providers: [UploadService, StorageService]
})
export class UploadModule { }
