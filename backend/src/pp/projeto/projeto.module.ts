import { Module } from '@nestjs/common';
import { ProjetoService } from './projeto.service';
import { ProjetoController } from './projeto.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { UploadModule } from '../../upload/upload.module';
import { ProjetoProxyPdmMetasService } from './projeto.proxy-pdm-metas.service';
import { ProjetoProxyPdmMetasController } from './projeto.proxy-pdm-metas.controller';
import { MetaModule } from '../../meta/meta.module';

@Module({
    imports: [PrismaModule, PortfolioModule, UploadModule, MetaModule],
    controllers: [ProjetoController, ProjetoProxyPdmMetasController],
    providers: [ProjetoService, ProjetoProxyPdmMetasService],
    exports: [ProjetoService]
})
export class ProjetoModule { }
