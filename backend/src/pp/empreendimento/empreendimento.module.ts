import { Module } from '@nestjs/common';
import { EmpreendimentoController } from './empreendimento.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmpreendimentoService } from './empreendimento.service';

@Module({
    imports: [PrismaModule],
    controllers: [EmpreendimentoController],
    providers: [EmpreendimentoService],
})
export class EmpreendimentoModule {}
