import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkflowSituacaoService } from './workflow-situacao.service';
import { UpdateWorkflowSituacaoDto } from './dto/update-workflow-situacao.dto';
import { CreateWorkflowSituacaoDto } from './dto/create-workflow-situacao.dto';
import { ListWorkflowSituacaoDto } from './entities/workflow-situacao.entity';

@ApiTags('Workflow - Configuração')
@Controller('workflow-situacao')
export class WorkflowSituacaoController {
    constructor(private readonly workflowSituacaoService: WorkflowSituacaoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.inserir'])
    async create(@Body() dto: CreateWorkflowSituacaoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.workflowSituacaoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.listar'])
    @Get()
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListWorkflowSituacaoDto> {
        return { linhas: await this.workflowSituacaoService.findAll(user) };
    }

    // @Get(':id')
    // @ApiBearerAuth('access-token')
    // @Roles(['CadastroWorkflows.listar'])
    //     // async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
    //     return await this.workflowSituacaoService.f(params.id, user);
    // }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateWorkflowSituacaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowSituacaoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.workflowSituacaoService.remove(+params.id, user);
        return '';
    }
}
