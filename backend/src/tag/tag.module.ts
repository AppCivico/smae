import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { TagController, TagPSController } from './tag.controller';
import { TagService } from './tag.service';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [TagController, TagPSController],
    providers: [TagService],
    exports: [TagService],
})
export class TagModule {}
