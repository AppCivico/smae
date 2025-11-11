import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PortfolioTagController } from './portfolio-tag.controller';
import { PortfolioTagService } from './portfolio-tag.service';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
    imports: [PrismaModule, PortfolioModule],
    controllers: [PortfolioTagController],
    providers: [PortfolioTagService],
    exports: [PortfolioTagService],
})
export class PortfolioTagModule {}
