import { Periodicidade } from "@prisma/client"
import { PainelConteudo } from "src/painel/entities/painel-conteudo.entity"


export class PainelDto {
    id: number
    nome: string
    ativo: boolean
    periodicidade: Periodicidade
    mostrar_planejado_por_padrao: boolean
    mostrar_acumulado_por_padrao: boolean
    mostrar_indicador_por_padrao: boolean

    painel_conteudo: PainelConteudo[] | null
}
