import { Module } from '@nestjs/common';
import { PortfolioModule } from '../../pp/portfolio/portfolio.module';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PPProjetoController } from './pp-projeto.controller';
import { PPProjetoService } from './pp-projeto.service';
import { RiscoService } from 'src/pp/risco/risco.service';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { PlanoAcaoService } from 'src/pp/plano-de-acao/plano-de-acao.service';
import { RiscoModule } from 'src/pp/risco/risco.module';
import { TarefaModule } from 'src/pp/tarefa/tarefa.module';
import { PlanoAcaoModule } from 'src/pp/plano-de-acao/plano-de-acao.module';
import { TarefaUtilsService } from 'src/pp/tarefa/tarefa.service.utils';
import { GraphvizModule } from 'src/graphviz/graphviz.module';
import { TarefaDotTemplate } from 'src/pp/tarefa/tarefa.dot.template';
import { AcompanhamentoModule } from 'src/pp/acompanhamento/acompanhamento.module';
import { AcompanhamentoService } from 'src/pp/acompanhamento/acompanhamento.service';

@Module({
    imports: [
        PrismaModule,
        ProjetoModule,
        PortfolioModule,
        UploadModule,
        RiscoModule,
        TarefaModule,
        PlanoAcaoModule,
        GraphvizModule,
        AcompanhamentoModule
    ],
    controllers: [PPProjetoController],
    providers: [
        PPProjetoService,
        ProjetoService,
        RiscoService,
        TarefaService,
        PlanoAcaoService,
        TarefaUtilsService,
        TarefaDotTemplate,
        AcompanhamentoService
    ],
    exports: [PPProjetoService],
})
export class PPProjetoModule {}
