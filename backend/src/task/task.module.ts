import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EchoModule } from './echo/echo.module';
import { RefreshMetaModule } from './refresh_meta/refresh-meta.module';
import { RefreshMvModule } from './refresh_mv/refresh-mv.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { AvisoEmailTaskModule } from './aviso_email/aviso_email.module';
import { AeCronogramaTpModule } from './aviso_email_cronograma_tp/ae_cronograma_tp.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => EchoModule),
        forwardRef(() => RefreshMvModule),
        forwardRef(() => RefreshMetaModule),
        forwardRef(() => AvisoEmailTaskModule),
        forwardRef(() => AeCronogramaTpModule),
    ],
    controllers: [TaskController],
    providers: [TaskService],
    exports: [TaskService],
})
export class TaskModule {}
