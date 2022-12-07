import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GrupoPaineisController } from './grupo-paineis.controller';
import { GrupoPaineisService } from './grupo-paineis.service';

@Module({
    imports: [PrismaModule],
    controllers: [GrupoPaineisController],
    providers: [GrupoPaineisService]
})
export class GrupoPaineisModule { }
