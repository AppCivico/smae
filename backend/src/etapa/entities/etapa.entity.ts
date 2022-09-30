export class Etapa {
    id: number
    etapa_pai_id: number | null
    regiao_id: number | null    

    descricao:        string | null
    nivel:       string | null
    inicio_previsto:  Date
    termino_previsto: Date
    inicio_real:      Date | null
    termino_real:     Date | null
    prazo: Date | null
}