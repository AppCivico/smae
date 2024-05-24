import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkflowFaseService } from './workflow-fase.service';
import { CreateWorkflowFaseDto } from './dto/create-workflow-fase.dto';
import { ListWorkflowFaseDto } from './entities/workflow-fase.entity';
import { UpdateWorkflowFaseDto } from './dto/update-workflow-fase.dto';

@ApiTags('Workflow - Configuração')
@Controller('workflow-fase')
export class WorkflowFaseController {
    constructor(private readonly workflowFaseService: WorkflowFaseService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.inserir'])
    async create(@Body() dto: CreateWorkflowFaseDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.workflowFaseService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.listar'])
    @Get()
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListWorkflowFaseDto> {
        return { linhas: await this.workflowFaseService.findAll(user) };
    }

    // @Get(':id')
    // @ApiBearerAuth('access-token')
    // @Roles(['CadastroWorkflows.listar'])
    //     // async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
    //     return await this.workflowFaseService.f(params.id, user);
    // }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateWorkflowFaseDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowFaseService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.workflowFaseService.remove(+params.id, user);
        return '';
    }
}
