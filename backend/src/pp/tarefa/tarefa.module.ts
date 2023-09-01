import { Module } from '@nestjs/common';
import { GraphvizModule } from 'src/graphviz/graphviz.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { PortfolioService } from '../portfolio/portfolio.service';
import { ProjetoModule } from '../projeto/projeto.module';
import { ProjetoService } from '../projeto/projeto.service';
import { TarefaController } from './tarefa.controller';
import { TarefaService } from './tarefa.service';
import { TarefaUtilsService } from './tarefa.service.utils';
import { TarefaDotTemplate } from './tarefa.dot.template';

@Module({
    imports: [PrismaModule, ProjetoModule, PortfolioModule, UploadModule, GraphvizModule],
    controllers: [TarefaController],
    providers: [TarefaService, ProjetoService, TarefaUtilsService, PortfolioService, TarefaDotTemplate],
    exports: [TarefaService],
})
export class TarefaModule {}
