import { Module, forwardRef } from '@nestjs/common';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PPProjetosController } from './pp-projetos.controller';
import { PPProjetosService } from './pp-projetos.service';
import { TarefaModule } from '../../pp/tarefa/tarefa.module';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjetoModule), forwardRef(() => TarefaModule)],
    controllers: [PPProjetosController],
    providers: [PPProjetosService],
    exports: [PPProjetosService],
})
export class PPProjetosModule {}
