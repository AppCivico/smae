import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { RiscoController } from './risco.controller';
import { RiscoService } from './risco.service';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjetoModule), PortfolioModule, UploadModule],
    controllers: [RiscoController],
    providers: [RiscoService],
    exports: [RiscoService],
})
export class RiscoModule {}
