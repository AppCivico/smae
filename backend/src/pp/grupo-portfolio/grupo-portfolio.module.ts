import { Module } from '@nestjs/common';
import { GrupoPortfolioController } from './grupo-portfolio.controller';
import { GrupoPortfolioService } from './grupo-portfolio.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GrupoPortfolioController],
    providers: [GrupoPortfolioService],
})
export class GrupoPortfolioModule {}
