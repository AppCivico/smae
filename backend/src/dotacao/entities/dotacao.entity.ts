export class ValorPlanejadoDto {
    informacao_valida: boolean
    empenho_liquido: number
    id: number
    smae_soma_valor_planejado: number
}

export class ValorRealizadoDotacaoDto {
    id: number
    dotacao: string
    informacao_valida: boolean
    empenho_liquido: number
    valor_liquidado: number
    mes_utilizado: number

    smae_soma_valor_empenho: number
    smae_soma_valor_liquidado: number
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
