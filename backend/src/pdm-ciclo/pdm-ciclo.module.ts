import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PdmCicloController } from './pdm-ciclo.controller';
import { PdmCicloService } from './pdm-ciclo.service';

@Module({
    imports: [PrismaModule],
    controllers: [PdmCicloController],
    providers: [PdmCicloService],
})
export class PdmCicloModule {}
