import { Injectable, Logger } from '@nestjs/common';
import { TaskableService } from '../entities/task.entity';
import { CreateRunUpdateDto } from './dto/create-run-update.dto';

@Injectable()
export class RunUpdateTaskService implements TaskableService {
    private readonly logger = new Logger(RunUpdateTaskService.name);

    constructor() {}

    async executeJob(params: CreateRunUpdateDto, taskId: string): Promise<any> {
        this.logger.log(`Executando tarefa de  update`);

        try {
            return 1;
        } catch (error) {
            // TODO: aqui teremos um comportamento diferente, pois o erro não imediatamente
            // interrompe a execução do job, mas teremos um limite de "tentativas" para processar o job.
            this.logger.error(`Failed to execute task: ${error}`);
            throw error;
        }
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
