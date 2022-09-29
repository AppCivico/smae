export class IdDesc {
    id: number
    descricao: string
}

export class IdNomeExibicao {
    id: number
    nome_exibicao: string
}

export class AtividadeOrgao {
    orgao: IdDesc
    responsavel: boolean
    participantes: IdNomeExibicao[]
}

export class Atividade {
    id: number
    status: string | null
    iniciativa_id: number
    codigo: string
    titulo: string
    contexto: string | null
    complemento: string | null
    orgaos_participantes: AtividadeOrgao[]
    coordenadores_cp: IdNomeExibicao[]
    compoe_indicador_iniciativa: boolean
}