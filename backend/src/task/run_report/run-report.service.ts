import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { TaskableService } from '../entities/task.entity';
import { CreateRunReportDto } from './dto/create-run-report.dto';
import { ReportsService } from '../../reports/relatorios/reports.service';

@Injectable()
export class RunReportTaskService implements TaskableService {
    private readonly logger = new Logger(RunReportTaskService.name);

    constructor(
        @Inject(forwardRef(() => ReportsService))
        private readonly reportsService: ReportsService
    ) {}

    async executeJob(params: CreateRunReportDto, taskId: string): Promise<any> {
        this.logger.log(`Executando tarefa de relatório com ID ${taskId}, relatório ID ${params.relatorio_id}`);

        try {
            await this.reportsService.executaRelatorio(params.relatorio_id);

            return { success: true, relatorio_id: params.relatorio_id };
        } catch (error) {
            this.logger.error(`Failed to execute report task: ${error}`);
            throw error;
        }
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
