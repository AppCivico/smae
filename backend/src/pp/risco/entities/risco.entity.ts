import { StatusRisco } from "@prisma/client"
import { PlanoAcao } from "src/pp/plano-de-acao/entities/plano-acao.entity"

export class ProjetoRisco {
    id: number
    codigo: number
    registrado_em: Date
    descricao: string | null
    causa: string | null
    consequencia: string | null
    probabilidade: number | null
    impacto: number | null
    nivel: number | null
    grau: number | null
    resposta: string | null
    risco_tarefa_outros: string | null
    status_risco: StatusRisco
}

export class ListProjetoRiscoDto {
    linhas: ProjetoRisco[]
}

export class ProjetoRiscoDetailDto {
    id: number
    codigo: number
    registrado_em: Date
    descricao: string | null
    causa: string | null
    consequencia: string | null
    probabilidade: number | null
    impacto: number | null
    nivel: number | null
    grau: number | null
    resposta: string | null
    risco_tarefa_outros: string | null
    status_risco: StatusRisco

    tarefas_afetadas?: ProjetoRiscoTarefa[]
    planos_de_acao?: PlanoAcao[]
}

export class ProjetoRiscoTarefa {
    tarefa_id?: number
    tarefa?: string
}
