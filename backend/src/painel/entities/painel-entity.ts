import { Periodicidade } from "@prisma/client"

export class Painel {
    id: number
    nome: string
    periodicidade: Periodicidade
    mostrar_planejado_por_padrao: boolean
    mostrar_acumulado_por_padrao: boolean
    mostrar_indicador_por_padrao: boolean
}
