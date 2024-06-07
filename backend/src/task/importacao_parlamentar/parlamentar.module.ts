import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { ImportacaoParlamentarService } from './parlamentar.service';
import { StorageService } from 'src/upload/storage-service';

@Module({
    imports: [PrismaModule, forwardRef(() => UploadModule)],
    providers: [ImportacaoParlamentarService, StorageService],
    exports: [ImportacaoParlamentarService],
})
export class ImportacaoParlamentarModule {}
