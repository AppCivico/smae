import { Module, forwardRef } from '@nestjs/common';
import { PlanoAcaoModule } from 'src/pp/plano-de-acao/plano-de-acao.module';
import { RiscoModule } from 'src/pp/risco/risco.module';
import { TarefaModule } from 'src/pp/tarefa/tarefa.module';
import { AcaoModule } from '../../pp/projeto/acao/acao.module';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PPProjetoController } from './pp-projeto.controller';
import { PPProjetoService } from './pp-projeto.service';
import { AcompanhamentoModule } from '../../pp/acompanhamento/acompanhamento.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => ProjetoModule),
        forwardRef(() => RiscoModule),
        forwardRef(() => PlanoAcaoModule),
        forwardRef(() => TarefaModule),
        forwardRef(() => AcompanhamentoModule),
        forwardRef(() => AcaoModule),
    ],
    controllers: [PPProjetoController],
    providers: [PPProjetoService],
    exports: [PPProjetoService],
})
export class PPProjetoModule {}
