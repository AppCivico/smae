import { Module } from '@nestjs/common';
import { PortfolioModule } from '../../pp/portfolio/portfolio.module';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PPProjetosController } from './pp-projetos.controller';
import { PPProjetosService } from './pp-projetos.service';

@Module({
    imports: [PrismaModule, ProjetoModule, PortfolioModule, UploadModule],
    controllers: [PPProjetosController],
    providers: [PPProjetosService, ProjetoService],
    exports: [PPProjetosService],
})
export class PPProjetosModule { }
