import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EchoModule } from './echo/echo.module';
import { RefreshMetaModule } from './refresh_meta/refresh-meta.module';
import { RefreshMvModule } from './refresh_mv/refresh-mv.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => EchoModule),
        forwardRef(() => RefreshMvModule),
        forwardRef(() => RefreshMetaModule),
    ],
    controllers: [TaskController],
    providers: [TaskService],
    exports: [TaskService],
})
export class TaskModule {}
