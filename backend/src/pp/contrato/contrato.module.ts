import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { ContratoMDOController, ContratoPPController } from './contrato.controller';
import { ContratoService } from './contrato.service';

@Module({
    imports: [PrismaModule, ProjetoModule],
    controllers: [ContratoMDOController, ContratoPPController],
    providers: [ContratoService],
    exports: [ContratoService],
})
export class ContratoModule {}
