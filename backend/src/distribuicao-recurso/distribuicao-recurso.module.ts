import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DistribuicaoRecursoController } from './distribuicao-recurso.controller';
import { DistribuicaoRecursoService } from './distribuicao-recurso.service';
import { BlocoNotaModule } from '../bloco-nota/bloco-nota/bloco-nota.module';
import { NotaModule } from '../bloco-nota/nota/nota.module';
import { AvisoEmailModule } from '../aviso-email/aviso-email.module';

@Module({
    imports: [PrismaModule, BlocoNotaModule, NotaModule, AvisoEmailModule],
    controllers: [DistribuicaoRecursoController],
    providers: [DistribuicaoRecursoService],
    exports: [DistribuicaoRecursoService],
})
export class DistribuicaoRecursoModule {}
