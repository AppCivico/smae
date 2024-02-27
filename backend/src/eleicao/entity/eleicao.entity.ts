import { EleicaoTipo } from "@prisma/client"

export class EleicaoDto {
    id: number
    ano: number
    tipo: EleicaoTipo
    atual_para_mandatos: boolean
}

export class ListEleicaoDto {
    linhas: EleicaoDto[]
}