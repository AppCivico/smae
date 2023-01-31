import { Module } from '@nestjs/common';
import { PortfolioModule } from '../../pp/portfolio/portfolio.module';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PPProjetoController } from './pp-projeto.controller';
import { PPProjetoService } from './pp-projeto.service';

@Module({
    imports: [PrismaModule, ProjetoModule, PortfolioModule, UploadModule],
    controllers: [PPProjetoController],
    providers: [PPProjetoService, ProjetoService],
    exports: [PPProjetoService],
})
export class PPProjetoModule { }
