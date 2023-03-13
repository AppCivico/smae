import { StatusRisco } from "@prisma/client"
import { IsNumber, IsOptional } from "class-validator"

export class PlanoAcao {
    id: number
    contramedida: string
    prazo_contramedida: Date | null
    custo: number | null
    custo_percentual: number | null
    medidas_de_contingencia: string
}

export class ListPlanoAcaoDto {
    linhas: PlanoAcao[]
}

export class PlanoAcaoDetailDto {
    id: number
    contramedida: string
    prazo_contramedida: Date | null
    custo: number | null
    custo_percentual: number | null
    medidas_de_contingencia: string
}
