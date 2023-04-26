export class LicaoAprendida {
    id: number
    sequencial: number
    data_registro: Date
    responsavel: string
    descricao: string
    observacao: string | null
    contexto: string | null
    resultado: string | null
}

export class ListLicoesAprendidasDto {
    linhas: LicaoAprendida[]
}