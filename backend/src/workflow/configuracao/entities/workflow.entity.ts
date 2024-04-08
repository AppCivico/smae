import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { WorkflowFluxoDto } from '../fluxo/entities/workflow-fluxo.entity';
import { OmitType, PartialType } from '@nestjs/swagger';
import { WorkflowfluxoFaseDto } from '../fluxo-fase/entities/workflow-fluxo-fase.entity';
import { WorkflowFluxoTarefaDto } from '../fluxo-tarefa/entities/workflow-fluxo-tarefa.entity';

export class WorkflowDto {
    id: number;
    ativo: boolean;
    inicio: Date;
    termino: Date | null;
    transferencia_tipo: IdNomeDto;
}

export class ListWorkflowDto {
    linhas: WorkflowDto[];
}

export class WorkflowDetailDto {
    id: number;
    ativo: boolean;
    inicio: Date;
    termino: Date | null;
    transferencia_tipo: IdNomeDto;

    fluxo: DetailWorkflowFluxoDto | null;
}

class DetailWorkflowFluxoDto extends PartialType(OmitType(WorkflowFluxoDto, ['workflow_id'])) {
    fases: DetailWorkflowFluxoFaseDto[];
}

class DetailWorkflowFluxoFaseDto extends PartialType(OmitType(WorkflowfluxoFaseDto, ['fluxo_id'])) {
    tarefas: DetailWorkflowFluxoFaseTarefaDto[];
}

class DetailWorkflowFluxoFaseTarefaDto extends PartialType(OmitType(WorkflowFluxoTarefaDto, ['fluxo_fase_id'])) {}
