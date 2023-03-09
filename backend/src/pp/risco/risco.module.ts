import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { PortfolioService } from '../portfolio/portfolio.service';
import { ProjetoModule } from '../projeto/projeto.module';
import { ProjetoService } from '../projeto/projeto.service';
import { RiscoController } from './risco.controller';
import { RiscoService } from './risco.service';


@Module({
    imports: [PrismaModule, ProjetoModule, PortfolioModule, UploadModule],
    controllers: [RiscoController],
    providers: [RiscoService, ProjetoService, PortfolioService],
    exports: [RiscoService],
})
export class RiscoModule { }
