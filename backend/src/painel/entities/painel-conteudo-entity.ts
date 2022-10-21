import { PainelConteudoTipoDetalhe, Periodicidade, Periodo } from "@prisma/client"

export class PainelConteudo {
    id: number
    meta_id: number
    indicador_id: number | null
    mostrar_planejado: boolean
    mostrar_acumulado: boolean
    mostrar_indicador: boolean
    periodicidade: Periodicidade
    periodo: Periodo | null
    periodo_fim: Date | null
    periodo_inicio: Date | null
    periodo_valor: number | null

    detalhes: PainelConteudoDetalhes[] | null
}
export class PainelConteudoDetalhes {
    tipo: PainelConteudoTipoDetalhe
    mostrar_indicador: boolean

    variavel: RowWithIdTitle | null
    iniciativa: RowWithIdTitle | null
    filhos: FirstLevelChildren[] | null
}

export class RowWithIdTitle {
    id: number
    titulo: string
}

export class FirstLevelChildren {
    tipo: PainelConteudoTipoDetalhe
    mostrar_indicador: boolean

    variavel: RowWithIdTitle | null
    atividade: RowWithIdTitle | null
    filhos: SecondLevelChildren[] | null
} 

export class SecondLevelChildren {
    tipo: PainelConteudoTipoDetalhe
    mostrar_indicador: boolean

    variavel: RowWithIdTitle | null
}