import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { AcompanhamentoController, AcompanhamentoMDOController } from './acompanhamento.controller';
import { AcompanhamentoService } from './acompanhamento.service';

@Module({
    imports: [PrismaModule, ProjetoModule],
    controllers: [AcompanhamentoController, AcompanhamentoMDOController],
    providers: [AcompanhamentoService],
    exports: [AcompanhamentoService],
})
export class AcompanhamentoModule {}
