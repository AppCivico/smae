import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjetoEtapaController, ProjetoEtapaMDOController } from './projeto-etapa.controller';
import { ProjetoEtapaService } from './projeto-etapa.service';
import { PortfolioModule } from 'src/pp/portfolio/portfolio.module';

@Module({
    imports: [PrismaModule, PortfolioModule],
    controllers: [ProjetoEtapaController, ProjetoEtapaMDOController],
    providers: [ProjetoEtapaService],
    exports: [ProjetoEtapaService],
})
export class ProjetoEtapaModule {}
