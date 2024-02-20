import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ObjetivoEstrategicoController, ObjetivoEstrategicoController2 } from './objetivo-estrategico.controller';
import { ObjetivoEstrategicoService } from './objetivo-estrategico.service';

@Module({
    imports: [PrismaModule],
    controllers: [ObjetivoEstrategicoController, ObjetivoEstrategicoController2],
    providers: [ObjetivoEstrategicoService],
    exports: [ObjetivoEstrategicoService],
})
export class ObjetivoEstrategicoModule {}
