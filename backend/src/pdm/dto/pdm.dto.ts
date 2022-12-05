
export class Pdm {
    nome: string
    descricao: string | null
    prefeito: string
    equipe_tecnica: string | null
    data_inicio: Date | null
    data_fim: Date | null
    data_publicacao: Date | null
    periodo_do_ciclo_participativo_inicio: Date | null
    periodo_do_ciclo_participativo_fim: Date | null
    rotulo_macro_tema: string | undefined
    rotulo_tema: string | undefined
    rotulo_sub_tema: string | undefined
    rotulo_contexto_meta: string | undefined
    rotulo_complementacao_meta: string | undefined
    possui_macro_tema: boolean
    possui_tema: boolean
    possui_sub_tema: boolean
    possui_contexto_meta: boolean
    possui_complementacao_meta: boolean
    logo: string | null
}
