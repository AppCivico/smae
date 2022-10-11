import { Periodicidade, Polaridade } from "@prisma/client"
import { FormulaVariaveis } from "src/indicador/dto/create-indicador.dto"

export class Indicador {
    id: number
    polaridade: Polaridade
    periodicidade: Periodicidade
    codigo: string
    titulo: string
    meta_id: number | null
    iniciativa_id: number | null
    atividade_id: number | null
    regionalizavel: boolean
    inicio_medicao: Date
    fim_medicao: Date
    nivel_regionalizacao: number | null
    contexto: string | null
    complemento: string | null
    formula: string | null
    calcular_acumulado: boolean | null
    indicador_formula_variavel: FormulaVariaveis[]
}
