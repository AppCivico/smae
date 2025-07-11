import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageService } from './storage-service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UploadDiretorioController } from './upload.diretorio.controller';
import { UploadDiretorioService } from './upload.diretorio.service';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET,
            signOptions: {},
        }),
    ],
    controllers: [UploadController, UploadDiretorioController],
    providers: [UploadService, StorageService, UploadDiretorioService],
    exports: [UploadService],
})
export class UploadModule {}
