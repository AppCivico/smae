import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrcamentoModule } from '../orcamento/orcamento.module';

@Module({
    imports: [PrismaModule, OrcamentoModule],
    controllers: [ReportsController],
    providers: [ReportsService]
})
export class ReportsModule { }
