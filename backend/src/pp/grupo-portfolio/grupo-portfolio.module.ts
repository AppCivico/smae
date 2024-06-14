import { Module } from '@nestjs/common';
import { GrupoPortfolioController, GrupoPortfolioMDOController } from './grupo-portfolio.controller';
import { GrupoPortfolioService } from './grupo-portfolio.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PessoaPrivilegioModule } from '../../auth/pessoaPrivilegio.module';

@Module({
    imports: [PrismaModule, PessoaPrivilegioModule],
    controllers: [GrupoPortfolioController, GrupoPortfolioMDOController],
    providers: [GrupoPortfolioService],
})
export class GrupoPortfolioModule {}
