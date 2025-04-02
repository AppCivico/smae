import { ApiProperty, refs } from '@nestjs/swagger';
import { task_type } from '@prisma/client';
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
