import { Module, forwardRef } from '@nestjs/common';
import { AvisoEmailTaskService } from './aviso_email.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TaskModule } from '../task.module';

@Module({
    imports: [PrismaModule, forwardRef(() => TaskModule)],
    providers: [AvisoEmailTaskService],
    exports: [AvisoEmailTaskService],
})
export class AvisoEmailTaskModule {}
