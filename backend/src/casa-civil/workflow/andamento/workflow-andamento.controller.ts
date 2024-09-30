import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkflowAndamentoDto } from './entities/workflow-andamento.entity';
import { FilterWorkflowAndamentoDto } from './dto/filter-andamento.dto';
import { WorkflowAndamentoService } from './workflow-andamento.service';
import { WorkflowIniciarProxEtapaDto } from './dto/iniciar-prox-etapa.dto';

@ApiTags('Workflow - Andamento')
@Controller('workflow-andamento')
export class WorkflowAndamentoController {
    constructor(private readonly workflowAndamentoService: WorkflowAndamentoService) {}

    @ApiBearerAuth('access-token')
    @Roles(['AndamentoWorkflow.listar'])
    @Get()
    async find(
        @Query() filters: FilterWorkflowAndamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<WorkflowAndamentoDto | void> {
        return this.workflowAndamentoService.findAndamento(filters, user);
    }

    @Post('iniciar-prox-etapa')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroWorkflows.inserir'])
    async iniciarFase(@Body() dto: WorkflowIniciarProxEtapaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.workflowAndamentoService.iniciarProximaEtapa(dto, user);
    }
}
