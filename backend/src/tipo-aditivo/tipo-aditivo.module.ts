import { Module } from '@nestjs/common';
import { ProjetoTipoAditivoService } from './tipo-aditivo.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjetoTipoAditivoController } from './tipo-aditivo.controller';

@Module({
    imports: [PrismaModule],
    controllers: [ProjetoTipoAditivoController],
    providers: [ProjetoTipoAditivoService],
})
export class ProjetoTipoAditivoModule {}
