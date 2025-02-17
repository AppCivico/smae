import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PortfolioController, PortfolioMDOController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

@Module({
    imports: [PrismaModule],
    controllers: [PortfolioController, PortfolioMDOController],
    providers: [PortfolioService],
    exports: [PortfolioService],
})
export class PortfolioModule {}
