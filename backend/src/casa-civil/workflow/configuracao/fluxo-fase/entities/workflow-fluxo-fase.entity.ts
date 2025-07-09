import { WorkflowResponsabilidade } from 'src/generated/prisma/client';
import { IsEnum } from 'class-validator';
import { WorkflowSituacaoDto } from '../../situacao/entities/workflow-situacao.entity';
import { WorkflowFaseDto } from '../../fase/entities/workflow-fase.entity';

export class WorkflowfluxoFaseDto {
    id: number;
    fluxo_id: number;
    fase: WorkflowFaseDto;
    ordem: number;
    marco: boolean;
    duracao: number | null;
    @IsEnum(WorkflowResponsabilidade)
    responsabilidade: WorkflowResponsabilidade;
    situacao: WorkflowSituacaoDto[];
}

export class ListWorkflowfluxoFaseDto {
    linhas: WorkflowfluxoFaseDto[];
}
