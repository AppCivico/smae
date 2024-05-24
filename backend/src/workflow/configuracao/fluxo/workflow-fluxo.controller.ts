import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkflowFluxoService } from './workflow-fluxo.service';
import { CreateWorkflowFluxoDto } from './dto/create-workflow-fluxo.dto';
import { ListWorkflowFluxoDto } from './entities/workflow-fluxo.entity';
import { UpdateWorkflowFluxoDto } from './dto/update-workflow-fluxo.dto';
import { FilterWorkflowFluxoDto } from './dto/filter-workflow-fluxo.dto';

@ApiTags('Workflow - Configuração')
@Controller('workflow-fluxo')
export class WorkflowFluxoController {
    constructor(private readonly workflowFluxoService: WorkflowFluxoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.inserir'])
    async create(@Body() dto: CreateWorkflowFluxoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.workflowFluxoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.listar'])
    @Get()
    async findAll(
        @Query() filters: FilterWorkflowFluxoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListWorkflowFluxoDto> {
        return { linhas: await this.workflowFluxoService.findAll(filters, user) };
    }

    // @Get(':id')
    // @ApiBearerAuth('access-token')
    // @Roles(['CadastroWorkflows.listar'])
    //     // async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
    //     return await this.workflowFluxoService.f(params.id, user);
    // }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateWorkflowFluxoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowFluxoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.workflowFluxoService.remove(+params.id, user);
        return '';
    }
}
