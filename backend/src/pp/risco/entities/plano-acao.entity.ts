import { StatusRisco } from "@prisma/client"

export class PlanoAcao {
    id: number
    contramedida: string
    prazo_contramedida: Date
    custo: number
    custo_percentual: number
    medidas_contrapartida: string
    status_risco: StatusRisco
}

export class ListPlanoAcao {
    linhas: PlanoAcao[]
}