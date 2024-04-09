import { Module, forwardRef } from '@nestjs/common';
import { NotaModule } from '../../bloco-nota/nota/nota.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AeNotaTaskService } from './ae_nota.service';

@Module({
    imports: [PrismaModule, forwardRef(() => NotaModule)],
    providers: [AeNotaTaskService],
    exports: [AeNotaTaskService],
})
export class AeNotaModule {}
