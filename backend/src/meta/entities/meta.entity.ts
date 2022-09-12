export class IdDesc {
    id: number
    descricao: string
}

export class IdNomeExibicao {
    id: number
    nome_exibicao: string
}

export class MetaOrgao {
    orgao: IdDesc
    responsavel: boolean
}

export class MetaResp {
    orgao: IdDesc
    pessoa: IdNomeExibicao
    coorderandor_responsavel_cp: boolean
}

export class Meta {
    id: number
    status: string
    pdm_id: number
    codigo: string
    titulo: string
    contexto: string | null
    complemento: string | null
    macro_tema: IdDesc | null
    tema: IdDesc | null
    sub_tema: IdDesc | null
    ativo: boolean
    meta_orgao: MetaOrgao[]
    meta_responsavel: MetaResp[]
}