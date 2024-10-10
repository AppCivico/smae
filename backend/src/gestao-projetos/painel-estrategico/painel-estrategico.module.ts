import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PainelEstrategicoController } from './painel-estrategico.controller';
import { PainelEstrategicoService } from './painel-estrategico.service';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { MetaModule } from '../../meta/meta.module';

@Module({
    imports: [PrismaModule,forwardRef(() => ProjetoModule), forwardRef(() => MetaModule)],
    controllers: [PainelEstrategicoController],
    providers: [PainelEstrategicoService],
    exports: [PainelEstrategicoService],
})
export class PainelEstrategicoModule {}
