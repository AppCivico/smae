import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkflowTarefaService } from './workflow-tarefa.service';
import { CreateWorkflowTarefaDto } from './dto/create-workflow-tarefa.dto';
import { ListWorkflowTarefaDto } from './entities/workflow-tarefa.entity';
import { UpdateWorkflowTarefaDto } from './dto/update-workflow-tarefa.dto';

@ApiTags('Workflow - Configuração')
@Controller('workflow-tarefa')
export class WorkflowTarefaController {
    constructor(private readonly workflowTarefaService: WorkflowTarefaService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.inserir'])
    async create(@Body() dto: CreateWorkflowTarefaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.workflowTarefaService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.listar'])
    @Get()
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListWorkflowTarefaDto> {
        return { linhas: await this.workflowTarefaService.findAll(user) };
    }

    // @Get(':id')
    // @ApiBearerAuth('access-token')
    // @Roles(['CadastroWorkflows.listar'])
    //     // async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
    //     return await this.workflowTarefaService.f(params.id, user);
    // }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateWorkflowTarefaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowTarefaService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.workflowTarefaService.remove(+params.id, user);
        return '';
    }
}
