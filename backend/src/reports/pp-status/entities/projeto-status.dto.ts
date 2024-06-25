export class RelProjetoStatusRelatorioDto {
    id: number;
    portfolio_id: number;
    codigo: string | null;
    nome: string;
    tarefas: string | null;
    detalhamento: string | null;
    pontos_atencao: string | null;
    cronograma: string;
    orgao_responsavel_sigla: string | null;
    previsao_custo: number | null;
    realizado_custo: number | null;
}

export class PPProjetoStatusRelatorioDto {
    linhas: RelProjetoStatusRelatorioDto[];
}
