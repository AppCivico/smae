import { PlanoAcao } from "src/pp/plano-de-acao/entities/plano-acao.entity"

export class ProjetoRisco {
    id: number
    codigo: number
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
    planos_de_acao?: PlanoAcao[]
}

export class ProjetoRiscoTarefa {
    tarefa_id?: number
    tarefa?: string
}
