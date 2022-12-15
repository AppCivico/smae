import { IdCodTituloDto } from "../../common/dto/IdCodTituloDto"

export class OrcamentoPlanejado {
    meta: IdCodTituloDto
    atividade: IdCodTituloDto | null
    iniciativa: IdCodTituloDto | null
    valor_planejado: number
    ano_referencia: number
    dotacao: string
    projeto_atividade: string

    pressao_orcamentaria: boolean | null
    pressao_orcamentaria_valor: string | null
    smae_soma_valor_planejado: string | null
    empenho_liquido: string | null

    criado_em: Date
    criador: {
        nome_exibicao: string
    }
    id: number
}
