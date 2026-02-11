import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { task_type } from '@prisma/client';
import { ApiLogRestoreService } from '../../api-logs/restore/api-log-restore.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { TaskService } from '../../task/task.service';
import { CreateApiLogDayDto } from '../dto/api-log/create-api-log-day.dto';

@ApiTags('SysAdmin - Operações de Reprocessamento e Sincronização')
@ApiBearerAuth('access-token')
@Controller()
export class SysadminLogsController {
    constructor(
        @Inject(TaskService)
        private readonly taskService: TaskService,

        @Inject(ApiLogRestoreService)
        private readonly apiRestoreService: ApiLogRestoreService
    ) {}

    /**
     * Restaura logs de API de um dia específico
     * Cria task assíncrona para restauração dos logs do DuckDB
     */
    @Post('logs/restore')
    @Roles(['SMAE.sysadmin'], 'Restaura logs de API de um dia específico')
    @ApiOkResponse({
        description: 'ID da task criada para restauração.',
        schema: {
            example: { taskId: 123 },
        },
    })
    @ApiResponse({ status: 201, description: 'Task de restauração criada com sucesso' })
    async restoreApiLogs(
        @Body() dto: CreateApiLogDayDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<{ taskId: number }> {
        const task = await this.taskService.create(
            {
                type: task_type.restore_api_log_day,
                params: {
                    date: dto.date,
                },
            },
            user
        );
        return { taskId: task.id };
    }

    /**
     * Remove logs restaurados de um dia específico
     */
    @Post('logs/drop')
    @Roles(['SMAE.sysadmin'])
    @ApiOperation({
        summary: 'Remove logs restaurados de um dia específico',
        description: 'Dropa dados restaurados do dia informado (UTC)',
    })
    @ApiResponse({
        status: 200,
        description: 'Drop concluído com sucesso.',
        schema: {
            example: {},
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Nenhum log restaurado encontrado para o dia especificado.',
    })
    @ApiResponse({
        status: 400,
        description: 'Requisição inválida ou status incorreto.',
    })
    async dropApiLogs(@Body() dto: CreateApiLogDayDto): Promise<void> {
        await this.apiRestoreService.dropDay(dto);
    }
}
