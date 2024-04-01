import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AvisoEmailController } from './aviso-email.controller';
import { AvisoEmailService } from './aviso-email.service';
import { TaskModule } from '../task/task.module';

@Module({
    imports: [PrismaModule, TaskModule],
    controllers: [AvisoEmailController],
    providers: [AvisoEmailService],
})
export class AvisoEmailModule {}
