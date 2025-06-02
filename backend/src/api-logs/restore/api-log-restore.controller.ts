import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { task_type } from '@prisma/client';
import { ApiTags, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { TaskService } from 'src/task/task.service';
import { CreateApiLogDayDto } from '../dto/create-api-log-day.dto.ts.js';

@ApiTags('api-logs')
@Controller('logs')
export class ApiLogManagementController {
    constructor(private readonly taskService: TaskService) {}

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
}
