export class ProjetoAcompanhamento {
    id: number
    data_registro: Date
    participantes: string
    responsavel: string | null
    detalhamento: string | null
    encaminhamento: string | null

    risco: RiscoIdCod[] | null
}

export class ListProjetoAcompanhamentoDto {
    linhas: ProjetoAcompanhamento[]
}

export class DetailProjetoAcompanhamentoDto {
    id: number
    data_registro: Date
    participantes: string
    responsavel: string | null
    prazo_encaminhamento: Date | null
    detalhamento: string | null
    encaminhamento: string | null
    observacao: string | null
    detalhamento_status: string | null
    pontos_atencao: string | null
    prazo_realizado: Date | null
    risco: RiscoIdCod[] | null
}

export class RiscoIdCod {
    id: number
    codigo: number
}

