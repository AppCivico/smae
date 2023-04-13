import { Module } from '@nestjs/common';
import { MetaModule } from '../../meta/meta.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ProjetoController } from './projeto.controller';
import { ProjetoProxyPdmMetasController } from './projeto.proxy-pdm-metas.controller';
import { ProjetoProxyPdmMetasService } from './projeto.proxy-pdm-metas.service';
import { ProjetoSeiService } from './projeto.sei.service';
import { ProjetoService } from './projeto.service';
import { PortfolioService } from '../portfolio/portfolio.service';

@Module({
    imports: [PrismaModule, PortfolioModule, UploadModule, MetaModule],
    controllers: [ProjetoController, ProjetoProxyPdmMetasController],
    providers: [ProjetoService, ProjetoProxyPdmMetasService, ProjetoSeiService],
    exports: [ProjetoService]
})
export class ProjetoModule { }
