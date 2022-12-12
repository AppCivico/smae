export class MetaOrcamento {
    meta_id: number
    ano_referencia: number
    soma_custeio_previsto: number
    soma_investimento_previsto: number
    //parte_dotacao: string
    ultima_revisao: boolean
    criado_em: Date
    criador: {
        nome_exibicao: string
    }
    id: number
}
