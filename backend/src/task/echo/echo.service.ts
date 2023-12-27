import { Injectable } from '@nestjs/common';
import { CreateEchoDto } from './dto/create-echo.dto';
import { TaskableService } from '../entities/task.entity';

@Injectable()
export class EchoService implements TaskableService {
    async executeJob(inputParams: CreateEchoDto, taskId: string): Promise<any> {
        return {
            echo: inputParams.echo,
            taskId,
        };
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
