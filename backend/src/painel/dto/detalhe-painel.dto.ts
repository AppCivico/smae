import { Periodicidade, Periodo, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';

export class DetailPainelVisualizacaoDto {
    id: number
    periodicidade: Periodicidade
    periodo: Periodo | null
    periodo_valor: number | null
    periodo_inicio: Date | null
    periodo_fim: Date | null
    mostrar_acumulado: boolean
    mostrar_planejado: boolean
    ordem: number | null
}

export class PainelConteudoSerieDto {
    id: number
    meta_id: number

}

export class PainelConteudoSerie {
    meta: PainelConteudoMetaSerie
    detalhes: PainelConteudoDetalhesSeries[] | null

    /**
     * contextualiza qual a ordem que as séries serão apresentadas dentro da array Series
     * @example "["Previsto", "PrevistoAcumulado", "Realizado", "RealizadoAcumulado"]"
    */
    ordem_series: string[]
}

export class PainelConteudoMetaSerie {
    id: number
    titulo: string
    codigo: string
    indicador?: RowWithIdTitleSeries | null
}
export class PainelConteudoDetalhesSeries {
    variavel: RowWithIdTitleSeries | null
    iniciativa: RowWithIdTitleSeries | null
    filhos: FirstLevelChildren[] | null
}

export class RowWithIdTitleSeries {
    id?: number | null
    titulo?: string | null
    codigo?: string | null
    series?: SeriesTemplate[] | null
}

export class FirstLevelChildren {
    variavel: RowWithIdTitleSeries | null
    atividade: RowWithIdTitleSeries | null
    filhos: SecondLevelChildren[] | null
}

export class SecondLevelChildren {
    variavel: RowWithIdTitleSeries | null
}
export class SeriesTemplate {
    titulo: string
    periodo_inicio: Date
    periodo_fim: Date

    /**
     * 
     * @example "["", 123.456, 0, 1]"
    */
    valores_nominais: (number | Decimal | "")[]
}