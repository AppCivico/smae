export class Etapa {
    id: number
    cronograma_id: number
    etapa_pai_id: number | null
    regiao_id: number | null

    titulo: string | null
    descricao: string | null
    nivel: string | null
    inicio_previsto: Date | null
    termino_previsto: Date | null
    inicio_real: Date | null
    termino_real: Date | null
    prazo: number | null
    etapa_filha: any | null
}