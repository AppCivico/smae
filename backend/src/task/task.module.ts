import { Module, forwardRef } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { EchoModule } from './echo/echo.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RefreshMvModule } from './refresh_mv/refresh-mv.module';

@Module({
    imports: [PrismaModule, forwardRef(() => EchoModule), forwardRef(() => RefreshMvModule)],
    controllers: [TaskController],
    providers: [TaskService],
    exports: [TaskService],
})
export class TaskModule {}
