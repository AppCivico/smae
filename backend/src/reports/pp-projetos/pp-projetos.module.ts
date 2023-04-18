import { Module } from '@nestjs/common';
import { PortfolioModule } from '../../pp/portfolio/portfolio.module';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PPProjetosController } from './pp-projetos.controller';
import { PPProjetosService } from './pp-projetos.service';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { TarefaModule } from 'src/pp/tarefa/tarefa.module';
import { TarefaUtilsService } from 'src/pp/tarefa/tarefa.service.utils';
import { TarefaDotTemplate } from 'src/pp/tarefa/tarefa.dot.template';
import { GraphvizModule } from 'src/graphviz/graphviz.module';

@Module({
    imports: [PrismaModule, ProjetoModule, PortfolioModule, UploadModule, TarefaModule, GraphvizModule],
    controllers: [PPProjetosController],
    providers: [PPProjetosService, ProjetoService, TarefaService, TarefaUtilsService, TarefaDotTemplate],
    exports: [PPProjetosService],
})
export class PPProjetosModule { }
