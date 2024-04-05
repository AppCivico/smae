export class WorkflowEtapaDto {
    id: number;
    etapa_fluxo: string;
}

export class ListWorkflowEtapaDto {
    linhas: WorkflowEtapaDto[];
}
