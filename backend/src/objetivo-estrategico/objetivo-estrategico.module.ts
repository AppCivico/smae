import { Module } from '@nestjs/common';
import { ObjetivoEstrategicoService } from './objetivo-estrategico.service';
import { ObjetivoEstrategicoController, ObjetivoEstrategicoController2 } from './objetivo-estrategico.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ObjetivoEstrategicoController,ObjetivoEstrategicoController2],
    providers: [ObjetivoEstrategicoService]
})
export class ObjetivoEstrategicoModule { }
