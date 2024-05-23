import { Module, forwardRef } from '@nestjs/common';
import { UploadModule } from 'src/upload/upload.module';
import { MetaModule } from '../../meta/meta.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ProjetoController } from './projeto.controller';
import { ProjetoProxyPdmMetasController } from './projeto.proxy-pdm-metas.controller';
import { ProjetoProxyPdmMetasService } from './projeto.proxy-pdm-metas.service';
import { ProjetoSeiService } from './projeto.sei.service';
import { ProjetoService } from './projeto.service';
import { GeoLocModule } from '../../geo-loc/geo-loc.module';
import { BlocoNotaModule } from '../../bloco-nota/bloco-nota/bloco-nota.module';
import { TarefaModule } from '../tarefa/tarefa.module';

@Module({
    imports: [
        PrismaModule,
        GeoLocModule,
        MetaModule,
        UploadModule,
        PortfolioModule,
        BlocoNotaModule,
        forwardRef(() => TarefaModule),
    ],
    controllers: [ProjetoController, ProjetoProxyPdmMetasController],
    providers: [ProjetoService, ProjetoProxyPdmMetasService, ProjetoSeiService],
    exports: [ProjetoService],
})
export class ProjetoModule {}
