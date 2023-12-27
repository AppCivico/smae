import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateEchoDto } from './echo/dto/create-echo.dto';
import { TaskService } from './task.service';
import { CreateRefreshMvDto } from './refresh_mv/dto/create-refresh-mv.dto';

const roles: ListaDePrivilegios[] = ['SMAE.superadmin'];

@Controller('task')
@ApiTags('Task')
export class TaskController {
    constructor(private readonly taskService: TaskService) {}
    @Post()
    @ApiUnauthorizedResponse()
    @ApiBearerAuth('access-token')
    @Roles(...roles)
    @ApiExtraModels(CreateEchoDto, CreateRefreshMvDto)
    async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.taskService.create(createTaskDto, user);
    }

    @Get(':id')
    @ApiUnauthorizedResponse()
    @ApiBearerAuth('access-token')
    @Roles(...roles)
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        return await this.taskService.findOne(+params.id, user);
    }

    @Patch('/run-in-foreground/:id')
    @ApiUnauthorizedResponse()
    @ApiBearerAuth('access-token')
    @Roles(...roles)
    async run_in_fg(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<any> {
        return await this.taskService.runInFg(+params.id, user);
    }
}
