import { IdCodTituloDto } from "../../common/dto/IdCodTituloDto"

export class OrcamentoRealizado {
    meta: IdCodTituloDto
    atividade: IdCodTituloDto | null
    iniciativa: IdCodTituloDto | null
    ano_referencia: number
    dotacao: string
    processo: string | null
    nota_empenho: string | null

    valor_empenho: string
    valor_liquidado: string

    smae_soma_valor_empenho: string | null
    smae_soma_valor_liquidado: string | null

    criado_em: Date
    criador: {
        nome_exibicao: string
    }
    id: number
}
