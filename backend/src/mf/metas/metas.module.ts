import { Module } from '@nestjs/common';
import { MetasService } from './metas.service';
import { MetasController } from './metas.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MfModule } from '../mf.module';
import { VariavelModule } from 'src/variavel/variavel.module';

@Module({
    imports: [PrismaModule, MfModule, VariavelModule],
    controllers: [MetasController],
    providers: [MetasService]
})
export class MetasModule { }
