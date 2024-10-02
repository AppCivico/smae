import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkflowEtapaService } from './workflow-etapa.service';
import { CreateWorkflowEtapaDto } from './dto/create-workflow-etapa.dto';
import { ListWorkflowEtapaDto } from './entities/workflow-etapa.entity';
import { UpdateWorkflowEtapaDto } from './dto/update-workflow-etapa.dto';
import { FilterWorkflowEtapaDto } from '../dto/filter-workflow.dto';

@ApiTags('Workflow - Configuração')
@Controller('workflow-etapa')
export class WorkflowEtapaController {
    constructor(private readonly workflowEtapaService: WorkflowEtapaService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.inserir'])
    async create(@Body() dto: CreateWorkflowEtapaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.workflowEtapaService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.listar'])
    @Get()
    async findAll(
        @Query() filters: FilterWorkflowEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListWorkflowEtapaDto> {
        return { linhas: await this.workflowEtapaService.findAll(filters, user) };
    }

    // @Get(':id')
    // @ApiBearerAuth('access-token')
    // @Roles(['CadastroWorkflows.listar'])
    //     // async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
    //     return await this.workflowEtapaService.f(params.id, user);
    // }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateWorkflowEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowEtapaService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.workflowEtapaService.remove(+params.id, user);
        return '';
    }
}
