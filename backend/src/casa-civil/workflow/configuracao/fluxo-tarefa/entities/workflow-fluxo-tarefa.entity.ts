import { WorkflowResponsabilidade } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { WorkflowTarefaDto } from '../../tarefa/entities/workflow-tarefa.entity';

export class WorkflowFluxoTarefaDto {
    id: number | null;
    tarefa_cronograma_id?: number | null;
    workflow_tarefa: WorkflowTarefaDto | null;
    fluxo_fase_id: number;
    ordem: number;
    marco: boolean;
    duracao: number | null;
    @IsEnum(WorkflowResponsabilidade)
    responsabilidade: WorkflowResponsabilidade;
}

export class ListWorkflowFluxoTarefaDto {
    linhas: WorkflowFluxoTarefaDto[];
}
