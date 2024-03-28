import { Module } from '@nestjs/common';
import { AvisoEmailTaskService } from './aviso_email.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [AvisoEmailTaskService],
    exports: [AvisoEmailTaskService],
})
export class AvisoEmailTaskModule {}
