import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EtapaController } from './etapa.controller';
import { EtapaService } from './etapa.service';

@Module({
    imports: [PrismaModule],
    controllers: [EtapaController],
    providers: [EtapaService],
    exports: [EtapaService],
})
export class EtapaModule {}
