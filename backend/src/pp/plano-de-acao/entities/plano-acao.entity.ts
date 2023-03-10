import { StatusRisco } from "@prisma/client"
import { IsNumber, IsOptional } from "class-validator"

export class PlanoAcao {
    id: number
    contramedida: string
    prazo_contramedida: Date
    custo: number
    custo_percentual: number
    medidas_contrapartida: string
}

export class ListPlanoAcaoDto {
    linhas: PlanoAcao[]
}

export class PlanoAcaoDetailDto {
    id: number
    contramedida: string
    prazo_contramedida: Date
    custo: number
    custo_percentual: number
    medidas_contrapartida: string
}
