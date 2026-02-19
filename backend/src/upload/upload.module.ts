import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SmaeConfigModule } from '../common/services/smae-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GotenbergService } from './gotenberg.service';
import { PreviewService } from './preview.service';
import { StorageService } from './storage-service';
import { ThumbnailService } from './thumbnail.service';
import { PublicUploadController } from './public-upload.controller';
import { UploadController } from './upload.controller';
import { UploadDiretorioController } from './upload.diretorio.controller';
import { UploadDiretorioService } from './upload.diretorio.service';
import { UploadService } from './upload.service';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET,
            signOptions: {},
        }),
        SmaeConfigModule,
    ],
    controllers: [UploadController, UploadDiretorioController, PublicUploadController],
    providers: [UploadService, StorageService, UploadDiretorioService, GotenbergService, PreviewService, ThumbnailService],
    exports: [UploadService, GotenbergService, PreviewService, ThumbnailService],
})
export class UploadModule {}
