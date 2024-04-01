import { Module, forwardRef } from '@nestjs/common';
import { TarefaModule } from '../../pp/tarefa/tarefa.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AeCronogramaTpTaskService } from './ae_cronograma_tp.service';

@Module({
    imports: [PrismaModule, forwardRef(() => TarefaModule)],
    providers: [AeCronogramaTpTaskService],
    exports: [AeCronogramaTpTaskService],
})
export class AeCronogramaTpModule {}
