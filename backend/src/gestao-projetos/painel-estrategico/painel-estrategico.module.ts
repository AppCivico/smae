import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PainelEstrategicoController } from './painel-estrategico.controller';
import { PainelEstrategicoService } from './painel-estrategico.service';

@Module({
    imports: [PrismaModule],
    controllers: [PainelEstrategicoController],
    providers: [PainelEstrategicoService],
    exports: [PainelEstrategicoService],
})
export class PainelEstrategicoModule {}
