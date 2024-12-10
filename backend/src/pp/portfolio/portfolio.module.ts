import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PortfolioController, PortfolioMDOController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { ProjetoModule } from '../projeto/projeto.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => ProjetoModule),
    ],
    controllers: [
        PortfolioController,
        PortfolioMDOController
    ],
    providers: [PortfolioService],
    exports: [PortfolioService],
})
export class PortfolioModule {}
