import { WorkflowResponsabilidade } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { WorkflowFaseDto } from 'src/workflow/configuracao/fase/entities/workflow-fase.entity';
import { WorkflowSituacaoDto } from '../../situacao/entities/workflow-situacao.entity';

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
