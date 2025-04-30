import { ApiProperty } from '@nestjs/swagger';
import { task_status, task_type } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { TaskContext } from '../task.context';

export class TaskSingleDto {
    id: number;
    @IsEnum(task_type)
    tipo: task_type;
    params: any;
    @IsEnum(task_status)
    @ApiProperty({ enum: task_status, name: 'task_status' })
    status: task_status;
    output: any;
    criado_em: string;
    iniciou_em: string | null;
    terminou_em: string | null;
    erro_em: string | null;
    erro_mensagem: string | null;
}

export interface TaskableService {
    outputToJson(jobOutput: any, params: any, jobId: string): JSON;
    executeJob(params: any, jobId: string, context?: TaskContext): Promise<any>;
}
