import { task_type } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { CreateEchoDto } from './echo/dto/create-echo.dto';
import { CreateRefreshMvDto } from './refresh_mv/dto/create-refresh-mv.dto';
import { CreateRefreshMetaDto } from './refresh_meta/dto/create-refresh-mv.dto';
import { CreateAvisoEmailJobDto } from './aviso_email/dto/create-aviso_email.dto';

export function ParseParams(taskType: task_type, value: any): any {
    let theClass: any = undefined;
    switch (taskType) {
        case 'echo':
            theClass = CreateEchoDto;
            break;
        case 'refresh_mv':
            theClass = CreateRefreshMvDto;
            break;
        case 'refresh_meta':
            theClass = CreateRefreshMetaDto;
            break;
        case 'aviso_email':
            theClass = CreateAvisoEmailJobDto;
            break;
        default:
            taskType satisfies never;
    }

    const validatorObject = plainToInstance(theClass, value);

    return validatorObject;
}
