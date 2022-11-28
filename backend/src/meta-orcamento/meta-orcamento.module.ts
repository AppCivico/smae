import { Module } from '@nestjs/common';
import { MetaOrcamentoService } from './meta-orcamento.service';
import { MetaOrcamentoController } from './meta-orcamento.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MetaOrcamentoController],
    providers: [MetaOrcamentoService]
})
export class MetaOrcamentoModule { }
