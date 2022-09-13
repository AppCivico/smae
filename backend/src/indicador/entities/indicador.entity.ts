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
    meta_id: number
    agregador: IdCodigoDto
    janela_agregador: number | null
    regionalizavel: boolean
    inicio_medicao: Date
    fim_medicao: Date
}
