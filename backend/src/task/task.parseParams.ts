import { task_type } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { CreateEchoDto } from './echo/dto/create-echo.dto';
import { CreateRefreshMvDto } from './refresh_mv/dto/create-refresh-mv.dto';

export function ParseParams(taskType: task_type, value: any): any {
    let theClass: any = undefined;
    switch (taskType) {
        case 'echo':
            theClass = CreateEchoDto;
            break;
        case 'refresh_mv':
            theClass = CreateRefreshMvDto;
            break;

        default:
            taskType satisfies never;
    }

    const validatorObject = plainToInstance(theClass, value);

    return validatorObject;
}
