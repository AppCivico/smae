export class RelProjetoStatusRelatorioDto {
    id: number
    codigo: string | null
    nome: string
    tarefas: string | null
    detalhamento_status: string | null
    pontos_atencao: string | null
    //TODO adicionar status
    previsao_custo: number | null
    realizado_custo: number | null
}

export class PPProjetoStatusRelatorioDto {
    linhas: RelProjetoStatusRelatorioDto[]
}
