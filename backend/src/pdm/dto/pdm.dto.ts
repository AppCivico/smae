
export class Pdm {
    nome: string
    descricao: string | null
    prefeito: string
    equipe_tecnica: string | null
    data_inicio: string | null
    data_fim: string | null
    data_publicacao: string | null
    periodo_do_ciclo_participativo_inicio: string | null
    periodo_do_ciclo_participativo_fim: string | null
    rotulo_macro_tema: string
    rotulo_tema: string
    rotulo_sub_tema: string
    rotulo_contexto_meta: string
    rotulo_complementacao_meta: string
    possui_macro_tema: boolean
    possui_tema: boolean
    possui_sub_tema: boolean
    possui_contexto_meta: boolean
    possui_complementacao_meta: boolean
    logo: string | null
    ativo: boolean
    rotulo_iniciativa: string
    rotulo_atividade: string
    possui_iniciativa: boolean
    possui_atividade: boolean
    nivel_orcamento: string
    id: number
}
