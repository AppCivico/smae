import { WorkflowSituacaoTipo } from 'src/generated/prisma/client';
import { IsEnum } from 'class-validator';

export class WorkflowSituacaoDto {
    id: number;
    situacao: string;
    @IsEnum(WorkflowSituacaoTipo)
    tipo_situacao: WorkflowSituacaoTipo;
}

export class ListWorkflowSituacaoDto {
    linhas: WorkflowSituacaoDto[];
}
