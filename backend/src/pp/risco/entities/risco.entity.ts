export class ProjetoRisco {
    id: number
    codigo: number
    numero: number
    criado_em: Date
    descricao: string | null
    causa: string | null
    consequencia: string | null
    probabilidade: number | null
    impacto: number | null
    nivel: number | null
    grau: number | null
    resposta: string | null
}

export class ListProjetoRiscoDto {
    linhas: ProjetoRisco[]
}

export class ProjetoRiscoDetailDto {
    id: number
    codigo: number
    numero: number
    criado_em: Date
    descricao: string | null
    causa: string | null
    consequencia: string | null
    probabilidade: number | null
    impacto: number | null
    nivel: number | null
    grau: number | null
    resposta: string | null

    etapas_afetadas?: ProjetoRiscoTarefa[]
}

export class ProjetoRiscoTarefa {
    tarefa_id?: number
    tarefa?: string
    planos_de_acao?: ProjetoRiscoTarefaPlanoAcao[]
}

export class ProjetoRiscoTarefaPlanoAcao {
    id: number
    responsavel: string
    contramedida: string
    prazo_contramedida: Date
    custo: number
    custo_percentual: number
    medidas_contrapartida: string
}