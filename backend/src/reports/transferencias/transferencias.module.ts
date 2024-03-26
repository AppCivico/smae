import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransferenciasController } from './transferencias.controller';
import { TransferenciasService } from './transferencias.service';
import { TarefaModule } from 'src/pp/tarefa/tarefa.module';

@Module({
    imports: [PrismaModule, forwardRef(() => TarefaModule)],
    controllers: [TransferenciasController],
    providers: [TransferenciasService],
    exports: [TransferenciasService],
})
export class TransferenciasModule {}
