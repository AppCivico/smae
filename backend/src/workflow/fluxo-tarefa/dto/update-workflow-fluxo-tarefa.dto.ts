import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateWorkflowFluxoTarefaDto } from './create-workflow-fluxo-tarefa.dto';

export class UpdateWorkflowFluxoTarefaDto extends PartialType(
    OmitType(CreateWorkflowFluxoTarefaDto, ['fluxo_fase_id'])
) {}
