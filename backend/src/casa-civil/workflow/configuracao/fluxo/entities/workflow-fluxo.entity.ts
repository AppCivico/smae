import { WorkflowEtapaDto } from '../../etapa/entities/workflow-etapa.entity';

export class WorkflowFluxoDto {
    id: number;
    workflow_id: number;
    workflow_etapa_de: WorkflowEtapaDto;
    workflow_etapa_para: WorkflowEtapaDto;
    ordem: number;
}

export class ListWorkflowFluxoDto {
    linhas: WorkflowFluxoDto[];
}
