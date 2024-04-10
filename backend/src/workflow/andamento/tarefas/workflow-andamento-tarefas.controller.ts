import { Controller, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateWorkflowAndamentoTarefasDto } from './dto/update-workflow-andamento-tarefa.dto';
import { WorkflowAndamentoTarefasService } from './workflow-andamento-tarefas.service';

@ApiTags('Workflow - Andamento')
@Controller('workflow-andamento-tarefas')
export class WorkflowAndamentoTarefasController {
    constructor(private readonly workflowAndamentoTarefasService: WorkflowAndamentoTarefasService) {}

    @Patch('')
    @ApiBearerAuth('access-token')
    @Roles('CadastroWorkflows.inserir')
    @ApiUnauthorizedResponse()
    async create(
        @Body() dto: UpdateWorkflowAndamentoTarefasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId[]> {
        return await this.workflowAndamentoTarefasService.upsert(dto, user);
    }
}
