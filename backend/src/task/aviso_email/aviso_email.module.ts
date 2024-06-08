import { Module, forwardRef } from '@nestjs/common';
import { AvisoEmailTaskService } from './aviso_email.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TaskModule } from '../task.module';
import { NotaModule } from '../../bloco-nota/nota/nota.module';

@Module({
    imports: [PrismaModule, forwardRef(() => TaskModule), forwardRef(() => NotaModule)],
    providers: [AvisoEmailTaskService],
    exports: [AvisoEmailTaskService],
})
export class AvisoEmailTaskModule {}
