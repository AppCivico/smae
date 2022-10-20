import { Periodicidade, Periodo } from "@prisma/client"

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
}
