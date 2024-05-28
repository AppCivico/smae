import { Module, forwardRef } from '@nestjs/common';
import { ProjetoModule } from '../projeto/projeto.module';
import { TipoIntervencaoController } from './tipo-intervencao.controller';
import { TipoIntervencaoService } from './tipo-intervencao.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjetoModule)],
    controllers: [TipoIntervencaoController],
    providers: [TipoIntervencaoService],
})
export class TipoIntervencaoModule {}
