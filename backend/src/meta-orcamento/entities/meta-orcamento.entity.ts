export class MetaOrcamentoItemOutDto {
    custeio_previsto: string;
    investimento_previsto: string;
    parte_dotacao: string;
}

export class MetaOrcamento {
    meta_id: number
    ano_referencia: number
    soma_custeio_previsto: number
    soma_investimento_previsto: number
    ultima_revisao: boolean
    criado_em: Date
    criador: {
        nome_exibicao: string
    }
    itens: MetaOrcamentoItemOutDto[]
    id: number
}
