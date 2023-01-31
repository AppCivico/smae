import { Module } from '@nestjs/common';
import { PdmCicloService } from './pdm-ciclo.service';
import { PdmCicloController } from './pdm-ciclo.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PdmCicloController],
    providers: [PdmCicloService],
})
export class PdmCicloModule {}
