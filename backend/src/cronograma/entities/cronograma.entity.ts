export class Cronograma {
    id: number
    iniciativa_id: number | null
    meta_id: number | null
    atividade_id: number | null


    descricao: string | null
    observacao: string | null
    inicio_previsto: Date | null
    termino_previsto: Date | null
    inicio_real: Date | null
    termino_real: Date | null
    regionalizavel: boolean
    nivel_regionalizacao: number | null
}