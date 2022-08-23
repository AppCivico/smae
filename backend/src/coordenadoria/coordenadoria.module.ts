import { Module } from '@nestjs/common';
import { CoordenadoriaService } from './coordenadoria.service';
import { CoordenadoriaController } from './coordenadoria.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CoordenadoriaController],
    providers: [CoordenadoriaService]
})
export class CoordenadoriaModule { }
