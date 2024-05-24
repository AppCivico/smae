import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowService } from './workflow.service';
import { ListWorkflowDto, WorkflowDetailDto } from './entities/workflow.entity';
import { FilterWorkflowDto } from './dto/filter-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@ApiTags('Workflow - Configuração')
@Controller('workflow')
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.inserir'])
    async create(@Body() dto: CreateWorkflowDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.workflowService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.listar'])
    @Get()
    async findAll(@Query() filters: FilterWorkflowDto, @CurrentUser() user: PessoaFromJwt): Promise<ListWorkflowDto> {
        return { linhas: await this.workflowService.findAll(filters, user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.listar'])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<WorkflowDetailDto> {
        return await this.workflowService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateWorkflowDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.workflowService.remove(+params.id, user);
        return '';
    }
}
