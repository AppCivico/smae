export class WorkflowEtapaDto {
    id: number;
    // Modificando de "etapa_fluxo" para "descrição" para facilitar implementação do front-end.
    descricao: string;
}

export class ListWorkflowEtapaDto {
    linhas: WorkflowEtapaDto[];
}
