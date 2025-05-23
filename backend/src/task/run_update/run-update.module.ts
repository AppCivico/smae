import { forwardRef, Module } from '@nestjs/common';
import { RunUpdateTaskService } from './run-update.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProjetoModule } from 'src/pp/projeto/projeto.module';
import { PessoaModule } from 'src/pessoa/pessoa.module';
import { UploadModule } from '../../upload/upload.module';
import { TarefaModule } from 'src/pp/tarefa/tarefa.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => ProjetoModule),
        forwardRef(() => PessoaModule),
        forwardRef(() => TarefaModule),
        UploadModule,
    ],
    providers: [RunUpdateTaskService],
    exports: [RunUpdateTaskService],
})
export class RunUpdateModule {}
