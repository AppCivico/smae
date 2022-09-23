import { Periodicidade, Polaridade } from "@prisma/client"

class IdCodigoDto {
    id: number
    codigo: string
}

export class Indicador {
    id: number
    polaridade: Polaridade
    periodicidade: Periodicidade
    codigo: string
    titulo: string
    meta_id: number | null
    iniciativa_id: number | null
    atividade_id: number | null
    agregador: IdCodigoDto
    janela_agregador: number | null
    regionalizavel: boolean
    inicio_medicao: Date
    fim_medicao: Date
    nivel_regionalizacao: number | null
}
