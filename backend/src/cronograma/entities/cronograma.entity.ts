export class Cronograma {
    id: number
    iniciativa_id: number | null
    meta_id: number | null
    atividade_id: number | null
    

    descricao:        string | null
    observacao:       string | null
    inicio_previsto:  Date
    termino_previsto: Date
    inicio_real:      Date | null
    termino_real:     Date | null
    por_regiao:       boolean
    tipo_regiao:      string
}