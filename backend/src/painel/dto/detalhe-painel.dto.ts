import { Periodicidade, Periodo } from '@prisma/client';

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

export class SeriesTemplate {
    titulo: string
    periodo_inicio: Date
    periodo_fim: Date
    valores_nominais: number[]
}