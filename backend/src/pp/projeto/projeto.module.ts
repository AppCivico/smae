import { Module } from '@nestjs/common';
import { ProjetoService } from './projeto.service';
import { ProjetoController } from './projeto.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
    imports: [PrismaModule, PortfolioModule],
    controllers: [ProjetoController],
    providers: [ProjetoService],
})
export class ProjetoModule { }
