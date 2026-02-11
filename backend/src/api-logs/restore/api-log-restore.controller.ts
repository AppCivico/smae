import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { task_type } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { TaskService } from 'src/task/task.service';
import { CreateApiLogDayDto } from '../../sysadmin/dto/api-log/create-api-log-day.dto';
import { ApiLogRestoreService } from './api-log-restore.service.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Api Logs')
@Controller('logs')
export class ApiLogManagementController {
    constructor(
        private readonly taskService: TaskService,
        private readonly apiRestoreService: ApiLogRestoreService
    ) {}

}
