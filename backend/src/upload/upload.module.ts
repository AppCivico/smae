import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorageService } from 'src/upload/storage-service';

@Module({
    imports: [PrismaModule],
    controllers: [UploadController],
    providers: [UploadService, StorageService]
})
export class UploadModule { }
