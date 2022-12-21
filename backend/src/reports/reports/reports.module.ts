import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrcamentoModule } from '../orcamento/orcamento.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
    imports: [PrismaModule, OrcamentoModule, UploadModule],
    controllers: [ReportsController],
    providers: [ReportsService]
})
export class ReportsModule { }
