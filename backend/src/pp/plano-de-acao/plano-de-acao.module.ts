import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { PlanoAcaoController } from './plano-de-acao.controller';
import { PlanoAcaoService } from './plano-de-acao.service';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjetoModule), PortfolioModule, UploadModule],
    controllers: [PlanoAcaoController],
    providers: [PlanoAcaoService],
    exports: [PlanoAcaoService],
})
export class PlanoAcaoModule {}
