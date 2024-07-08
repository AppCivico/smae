import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { ContratoAditivoMDOController } from './contrato-aditivo.controller';
import { ContratoAditivoService } from './contrato-aditivo.service';

@Module({
    imports: [PrismaModule, ProjetoModule],
    controllers: [ContratoAditivoMDOController],
    providers: [ContratoAditivoService],
    exports: [ContratoAditivoService],
})
export class ContratoAditivoModule {}
