import { Module } from '@nestjs/common';
import { PortfolioModule } from '../../pp/portfolio/portfolio.module';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PPStatusController } from './pp-status.controller';
import { PPStatusService } from './pp-status.service';

@Module({
    imports: [PrismaModule, ProjetoModule, PortfolioModule, UploadModule],
    controllers: [PPStatusController],
    providers: [PPStatusService, ProjetoService],
    exports: [PPStatusService],
})
export class PPStatusModule {}
