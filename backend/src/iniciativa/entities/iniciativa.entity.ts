export class IdDesc {
    id: number
    descricao: string
}

export class IdNomeExibicao {
    id: number
    nome_exibicao: string
}

export class IniciativaOrgao {
    orgao: IdDesc
    responsavel: boolean
    participantes: IdNomeExibicao[]
}

export class Iniciativa {
    id: number
    status: string | null
    meta_id: number
    codigo: string
    titulo: string
    contexto: string | null
    complemento: string | null
    orgaos_participantes: IniciativaOrgao[]
    coordenadores_cp: IdNomeExibicao[]
    compoe_indicador_meta: boolean
}