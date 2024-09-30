import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateWorkflowFluxoTarefaDto } from './dto/create-workflow-fluxo-tarefa.dto';
import { UpdateWorkflowFluxoTarefaDto } from './dto/update-workflow-fluxo-tarefa.dto';
import { ListWorkflowFluxoTarefaDto } from './entities/workflow-fluxo-tarefa.entity';
import { WorkflowFluxoTarefaService } from './workflow-fluxo-tarefa.service';

@ApiTags('Workflow - Configuração')
@Controller('workflow-fluxo-tarefa')
export class WorkflowFluxoTarefaController {
    constructor(private readonly workflowFluxoTarefaService: WorkflowFluxoTarefaService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.inserir'])
    async create(@Body() dto: CreateWorkflowFluxoTarefaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.workflowFluxoTarefaService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.listar'])
    @Get()
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListWorkflowFluxoTarefaDto> {
        return { linhas: await this.workflowFluxoTarefaService.findAll(user) };
    }

    // @Get(':id')
    // @ApiBearerAuth('access-token')
    // @Roles(['CadastroWorkflows.listar'])
    //     // async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
    //     return await this.workflowFluxoTarefaService.f(params.id, user);
    // }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateWorkflowFluxoTarefaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowFluxoTarefaService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.workflowFluxoTarefaService.remove(+params.id, user);
        return '';
    }
}
