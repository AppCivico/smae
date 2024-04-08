import { WorkflowResponsabilidade } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { WorkflowFaseDto } from 'src/workflow/configuracao/fase/entities/workflow-fase.entity';

export class WorkflowfluxoFaseDto {
    id: number;
    fluxo_id: number;
    fase: WorkflowFaseDto;
    ordem: number;
    @IsEnum(WorkflowResponsabilidade)
    responsabilidade: WorkflowResponsabilidade;
}

export class ListWorkflowfluxoFaseDto {
    linhas: WorkflowfluxoFaseDto[];
}
