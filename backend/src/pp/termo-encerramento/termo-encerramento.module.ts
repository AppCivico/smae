import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { TermoEncerramentoController } from './termo-encerramento.controller';
import { TermoEncerramentoService } from './termo-encerramento.service';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => ProjetoModule),
        UploadModule,
    ],
    controllers: [TermoEncerramentoController],
    providers: [TermoEncerramentoService],
    exports: [TermoEncerramentoService],
})
export class TermoEncerramentoModule {}
