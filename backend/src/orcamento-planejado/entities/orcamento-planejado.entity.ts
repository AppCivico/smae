import { IdCodTituloDto } from "../../common/dto/IdCodTituloDto"

export class OrcamentoPlanejado {
    meta: IdCodTituloDto
    atividade: IdCodTituloDto | null
    iniciativa: IdCodTituloDto | null
    valor_planejado: number
    ano_referencia: number
    dotacao: string

    pressao_orcamentaria: boolean | null
    empenho_dotacao: number | null

    criado_em: Date
    criador: {
        nome_exibicao: string
    }
    id: number
}
