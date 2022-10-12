export class Meta {
    id: number
    titulo: string
    codigo: string
}

export class Iniciativa {
    id: number
    titulo: string
    codigo: string
    meta: Meta
}

export class Atividade {
    id: number
    titulo: string
    codigo: string
    iniciativa: Iniciativa
}

export class CronogramaWithParents {
    id: number
    meta_id: number | null
    iniciativa_id: number | null
    atividade_id: number | null
    descricao: string | null

    meta?: Meta | null
    iniciativa?: Iniciativa | null
    atividade?: Atividade | null
}

export class CronogramaEtapa {
    id: number
    cronograma_id: number
    etapa_id: number    
    ordem: number | null
    inativo: boolean

    etapa: any
    cronograma_origem_etapa?: CronogramaWithParents
}