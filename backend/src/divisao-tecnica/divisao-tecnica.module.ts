import { Module } from '@nestjs/common';
import { DivisaoTecnicaService } from './divisao-tecnica.service';
import { DivisaoTecnicaController } from './divisao-tecnica.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DivisaoTecnicaController],
    providers: [DivisaoTecnicaService]
})
export class DivisaoTecnicaModule { }
