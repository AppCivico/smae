export class CronogramaWithIdAndDesc {
    id: number
    meta_id: number | null
    iniciativa_id: number | null
    atividade_id: number | null
    descricao: string | null
}

export class CronogramaEtapa {
    id: number
    cronograma_id: number
    etapa_id: number    
    ordem: number | null
    inativo: boolean
    cronograma_origem_etapa: CronogramaWithIdAndDesc
}