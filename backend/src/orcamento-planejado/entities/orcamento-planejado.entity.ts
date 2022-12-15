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

    /**
    * campo vem do cruzamento com o SOF
    */
    smae_soma_valor_planejado: string | null
    /**
    * campo vem do cruzamento com o SOF
    */
    val_orcado_atualizado: string | null
    /**
    * campo vem do cruzamento com o SOF
    */
    val_orcado_inicial: string | null
    /**
    * campo vem do cruzamento com o SOF
    */
    saldo_disponivel: string | null


    criado_em: Date
    criador: {
        nome_exibicao: string
    }
    id: number
}
