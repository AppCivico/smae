import { Module } from '@nestjs/common';
import { OrcamentoPlanejadoService } from './orcamento-planejado.service';
import { OrcamentoPlanejadoController } from './orcamento-planejado.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [OrcamentoPlanejadoController],
    providers: [OrcamentoPlanejadoService]
})
export class OrcamentoPlanejadoModule { }
