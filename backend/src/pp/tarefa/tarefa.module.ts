import { Module, forwardRef } from '@nestjs/common';
import { GraphvizModule } from 'src/graphviz/graphviz.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { TarefaController, TarefaMDOController } from './tarefa.controller';
import { TarefaDotTemplate } from './tarefa.dot.template';
import { TarefaService } from './tarefa.service';
import { TarefaUtilsService } from './tarefa.service.utils';
import { TransferenciaModule } from 'src/casa-civil/transferencia/transferencia.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => ProjetoModule),
        forwardRef(() => TransferenciaModule),
        PortfolioModule,
        UploadModule,
        GraphvizModule,
    ],
    controllers: [TarefaController, TarefaMDOController],
    providers: [TarefaService, TarefaUtilsService, TarefaDotTemplate],
    exports: [TarefaService, TarefaUtilsService],
})
export class TarefaModule {}
