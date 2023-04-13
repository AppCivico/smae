import { IdSigla } from "src/common/dto/IdSigla.dto"

export class PlanoAcao {
    id: number
    contramedida: string
    prazo_contramedida: Date | null
    custo: number | null
    custo_percentual: number | null
    medidas_de_contingencia: string
    responsavel: string | null
    orgao: IdSigla | null
    contato_do_responsavel: string | null
    data_termino: Date | null
    projeto_risco: RiscoIdCod
}

export class RiscoIdCod {
    id: number
    codigo: number
}

export class ListPlanoAcaoDto {
    linhas: PlanoAcao[]
}

export class PlanoAcaoDetailDto {
    id: number
    contramedida: string
    prazo_contramedida: Date | null
    custo: number | null
    custo_percentual: number | null
    medidas_de_contingencia: string
    responsavel: string | null
    orgao: IdSigla | null
    contato_do_responsavel: string | null
    data_termino: Date | null
}
