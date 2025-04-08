import { forwardRef, Module } from '@nestjs/common';
import { RunUpdateTaskService } from './run-update.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProjetoModule } from 'src/pp/projeto/projeto.module';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjetoModule)],
    providers: [RunUpdateTaskService],
    exports: [RunUpdateTaskService],
})
export class RunUpdateModule {}
