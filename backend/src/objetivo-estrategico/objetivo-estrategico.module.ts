import { Module } from '@nestjs/common';
import { ObjetivoEstrategicoService } from './objetivo-estrategico.service';
import { ObjetivoEstrategicoController } from './objetivo-estrategico.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ObjetivoEstrategicoController],
    providers: [ObjetivoEstrategicoService]
})
export class ObjetivoEstrategicoModule { }
