export class ValorPlanejadoDto {
    informacao_valida: boolean
    empenho_liquido: string
    id: number
    smae_soma_valor_planejado: string
}

export class ValorRealizadoDotacaoDto {
    id: number
    dotacao: string
    informacao_valida: boolean
    empenho_liquido: string
    valor_liquidado: string
    mes_utilizado: number

    smae_soma_valor_empenho: string
    smae_soma_valor_liquidado: string
}

export class ListValorRealizadoDotacaoDto {
    linhas: ValorRealizadoDotacaoDto[]
}

export class ValorRealizadoProcessoDto extends ValorRealizadoDotacaoDto {
    processo: string
}

export class ListValorRealizadoProcessoDto {
    linhas: ValorRealizadoProcessoDto[]
}

export class ValorRealizadoNotaEmpenhoDto extends ValorRealizadoProcessoDto {
    nota_empenho: string
}

export class ListValorRealizadoNotaEmpenhoDto {
    linhas: ValorRealizadoNotaEmpenhoDto[]
}
