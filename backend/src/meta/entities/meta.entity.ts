export class IdDesc {
    id: number
    descricao: string
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
}