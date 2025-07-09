import { ApiProperty, refs } from '@nestjs/swagger';
import { task_type } from 'src/generated/prisma/client';
import { IsEnum } from 'class-validator';
import { CreateEchoDto } from '../echo/dto/create-echo.dto';
import { TaskValidatorOf } from '../task.validator';
import { CreateRefreshMetaDto } from '../refresh_meta/dto/create-refresh-mv.dto';
import { CreateRefreshMvDto } from '../refresh_mv/dto/create-refresh-mv.dto';
import { CreateRunUpdateDto } from '../run_update/dto/create-run-update.dto';

export class CreateTaskDto {
    @ApiProperty({ enum: task_type, enumName: 'task_type' })
    @IsEnum(task_type, {
        message: '$property| must be one of: ' + Object.values(task_type).join(', '),
    })
    type: task_type;

    /**
     * Parâmetros para a tarefa desejada
     */
    @TaskValidatorOf('type')
    @ApiProperty({
        oneOf: refs(CreateEchoDto, CreateRefreshMvDto, CreateRefreshMetaDto, CreateRunUpdateDto),
    })
    params: any;
}

export const RetryStrategy = {
    'FIXED': 'FIXED',
    'LINEAR': 'LINEAR',
    'EXPONENTIAL': 'EXPONENTIAL',
};
export type RetryStrategy = (typeof RetryStrategy)[keyof typeof RetryStrategy];

export class RetryConfigDto {
    maxRetries: number = 3;

    baseDelayMs: number = 1000;

    // Strategy for calculating delay between retries
    strategy: RetryStrategy = 'EXPONENTIAL';

    // Maximum delay in milliseconds
    maxDelayMs: number = 60000;

    // List of error types that should not be retried
    nonRetryableErrors: string[] = [];
}
