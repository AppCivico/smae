import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { task_type } from '@prisma/client';
import { ApiTags, ApiOkResponse, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { TaskService } from 'src/task/task.service';
import { CreateApiLogDayDto } from '../dto/create-api-log-day.dto.ts.js';
import { ApiLogRestoreService } from './api-log-restore.service.js';

@ApiTags('Api Logs')
@Controller('logs')
export class ApiLogManagementController {
    constructor(
        private readonly taskService: TaskService,
        private readonly apiRestoreService: ApiLogRestoreService
    ) {}

    @Post('restore')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(['SMAE.sysadmin'])
    @ApiOkResponse({
        description: 'ID da task criada para restauração.',
        schema: {
            example: { taskId: 123 },
        },
    })
    @ApiBearerAuth('access-token')
    async restoreApiLogs(@Body() dto: CreateApiLogDayDto, user: PessoaFromJwt | null): Promise<{ taskId: number }> {
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

    @Post('drop')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(['SMAE.sysadmin'])
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Dropa dados restaurados do dia informado (UTC).' })
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
