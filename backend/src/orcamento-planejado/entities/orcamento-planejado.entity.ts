export class OrcamentoPlanejado {
    meta_id: number
    atividade_id: number | null
    iniciativa_id: number | null
    valor_planejado: number
    ano_referencia: number
    dotacao: string

    pressao_orcamentaria: boolean | null
    empenho_dotacao: number | null

    criado_em: Date
    criador: {
        nome_exibicao: string
    }
    id: number
}
