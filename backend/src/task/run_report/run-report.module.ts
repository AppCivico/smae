import { forwardRef, Module } from '@nestjs/common';
import { ReportsModule } from '../../reports/relatorios/reports.module';
import { RunReportTaskService } from './run-report.service';

@Module({
    imports: [ forwardRef(() => ReportsModule)],
    providers: [RunReportTaskService],
    exports: [RunReportTaskService],
})
export class RunReportModule {}
