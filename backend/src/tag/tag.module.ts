import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { TagController, TagPSController } from './tag.controller';
import { TagService } from './tag.service';
import { PdmModule } from '../pdm/pdm.module';

@Module({
    imports: [PrismaModule, UploadModule, forwardRef(() => PdmModule)],
    controllers: [TagController, TagPSController],
    providers: [TagService],
    exports: [TagService],
})
export class TagModule {}
