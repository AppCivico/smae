import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { PortfolioService } from '../portfolio/portfolio.service';
import { ProjetoModule } from '../projeto/projeto.module';
import { ProjetoService } from '../projeto/projeto.service';
import { PlanoAcaoController } from './plano-de-acao.controller';
import { PlanoAcaoService } from './plano-de-acao.service';


@Module({
    imports: [PrismaModule, ProjetoModule, PortfolioModule, UploadModule],
    controllers: [PlanoAcaoController],
    providers: [PlanoAcaoService, ProjetoService, PortfolioService],
    exports: [PlanoAcaoService],
})
export class PlanoAcaoModule { }
