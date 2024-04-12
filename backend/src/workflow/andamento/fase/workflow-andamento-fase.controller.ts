import { Controller, Body, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
    UpdateWorkflowAndamentoFaseDto,
    WorkflowFinalizarIniciarFaseDto,
} from './dto/patch-workflow-andamento-fase.dto';
import { WorkflowAndamentoFaseService } from './workflow-andamento-fase.service';

@ApiTags('Workflow - Andamento')
@Controller('workflow-andamento-fase')
export class WorkflowAndamentoFaseController {
    constructor(private readonly workflowAndamentoFaseService: WorkflowAndamentoFaseService) {}

    @Patch('')
    @ApiBearerAuth('access-token')
    @Roles('CadastroWorkflows.inserir')
    @ApiUnauthorizedResponse()
    async update(
        @Body() dto: UpdateWorkflowAndamentoFaseDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowAndamentoFaseService.update(dto, user);
    }

    @Post('finalizar')
    @ApiBearerAuth('access-token')
    @Roles('CadastroWorkflows.inserir')
    @ApiUnauthorizedResponse()
    async finalizarFase(
        @Body() dto: WorkflowFinalizarIniciarFaseDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowAndamentoFaseService.finalizarFase(dto, user);
    }

    @Post('iniciar')
    @ApiBearerAuth('access-token')
    @Roles('CadastroWorkflows.inserir')
    @ApiUnauthorizedResponse()
    async iniciarFase(
        @Body() dto: WorkflowFinalizarIniciarFaseDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowAndamentoFaseService.iniciarFase(dto, user);
    }
}
