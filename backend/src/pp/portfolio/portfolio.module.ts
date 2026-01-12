import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PortfolioController, PortfolioMDOController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [PortfolioController, PortfolioMDOController],
    providers: [PortfolioService],
    exports: [PortfolioService],
})
export class PortfolioModule {}
