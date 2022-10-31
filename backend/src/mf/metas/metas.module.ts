import { Module } from '@nestjs/common';
import { MetasService } from './metas.service';
import { MetasController } from './metas.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MfModule } from '../mf.module';

@Module({
    imports: [PrismaModule, MfModule],
    controllers: [MetasController],
    providers: [MetasService]
})
export class MetasModule { }
