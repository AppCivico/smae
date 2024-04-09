import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AvisoEmailController } from './aviso-email.controller';
import { AvisoEmailService } from './aviso-email.service';
import { TaskModule } from '../task/task.module';
import { NotaModule } from '../bloco-nota/nota/nota.module';

@Module({
    imports: [PrismaModule, TaskModule, NotaModule],
    controllers: [AvisoEmailController],
    providers: [AvisoEmailService],
})
export class AvisoEmailModule {}
