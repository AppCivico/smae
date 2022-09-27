import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CronogramaController } from './cronograma.controller';
import { CronogramaService } from './cronograma.service';

@Module({
    imports: [PrismaModule],
    controllers: [CronogramaController],
    providers: [CronogramaService]
})
export class CronogramaModule { }
