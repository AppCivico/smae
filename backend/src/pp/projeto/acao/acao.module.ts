import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ReportsModule } from '../../../reports/relatorios/reports.module';
import { ProjetoModule } from '../projeto.module';
import { AcaoController, AcaoMDOController } from './acao.controller';
import { AcaoService } from './acao.service';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjetoModule), forwardRef(() => ReportsModule)],
    controllers: [AcaoController, AcaoMDOController],
    providers: [AcaoService],
})
export class AcaoModule {}
