import { WorkflowResponsabilidade } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { WorkflowTarefaDto } from 'src/workflow/configuracao/tarefa/entities/workflow-tarefa.entity';

export class WorkflowFluxoTarefaDto {
    id: number;
    workflow_tarefa: WorkflowTarefaDto;
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
