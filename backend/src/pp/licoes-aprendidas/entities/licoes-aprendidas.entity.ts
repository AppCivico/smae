export class LicaoAprendida {
    id: number
    data_registro: Date
    responsavel: string
    descricao: string
    observacao: string | null
}

export class ListLicoesAprendidasDto {
    linhas: LicaoAprendida[]
}