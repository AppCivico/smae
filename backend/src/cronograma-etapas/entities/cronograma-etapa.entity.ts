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

export class CECronogramaEtapaDto {
    id: number
    cronograma_id: number
    etapa_id: number
    ordem: number | null
    inativo: boolean

    etapa: CEEtapaDto | null
    cronograma_origem_etapa?: CronogramaWithParents
}

export class CECronogramaEtapaCronoId {
    cronograma_id: number
}

export class CEEtapaDto {
    id: number
    etapa_pai_id: number | null
    regiao_id: number | null
    nivel: string | null
    descricao: string | null
    inicio_previsto: Date | null
    termino_previsto: Date | null
    inicio_real: Date | null
    termino_real: Date | null
    prazo: number | null
    titulo: string | null
    duracao: string

    responsaveis: CronogramaEtapaResponsavel[] | null
    etapa_filha?: CEEtapaDto[] | null
    CronogramaEtapa: CECronogramaEtapaCronoId[]
}

export class CronogramaEtapaResponsavel {
    id: number
    nome_exibicao: string
}