import { Module } from '@nestjs/common';
import { ProjetoService } from './projeto.service';
import { ProjetoController } from './projeto.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { UploadModule } from '../../upload/upload.module';

@Module({
    imports: [PrismaModule, PortfolioModule, UploadModule],
    controllers: [ProjetoController],
    providers: [ProjetoService],
})
export class ProjetoModule { }
