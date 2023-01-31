import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [TagController],
    providers: [TagService],
})
export class TagModule {}
