export class WorkflowTarefaDto {
    id: number;
    // Modificando de "tarefa_fluxo" para "descrição" para facilitar implementação do front-end.
    descricao: string;
}

export class ListWorkflowTarefaDto {
    linhas: WorkflowTarefaDto[];
}
