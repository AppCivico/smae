import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { ImportacaoParlamentarService } from './parlamentar.service';

@Module({
    imports: [PrismaModule, forwardRef(() => UploadModule)],
    providers: [ImportacaoParlamentarService],
    exports: [ImportacaoParlamentarService],
})
export class ImportacaoParlamentarModule {}
