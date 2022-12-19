import { ApiProperty } from "@nestjs/swagger";
import { CodigoNome } from "../../../common/dto/CodigoNome.dto";
import { IdCodTituloDto } from "../../../common/dto/IdCodTitulo.dto";
import { IdSiglaDescricao } from "../../../common/dto/IdSigla.dto";

export class OrcamentoExecutadoSaidaDto {
    meta: IdCodTituloDto
    iniciativa: IdCodTituloDto | null
    atividade: IdCodTituloDto | null

    dotacao: string
    processo: string | null
    nota_empenho: string | null

    orgao: IdSiglaDescricao

    unidade: CodigoNome
    fonte: CodigoNome

    /**
     * fonte: SOF/ orçamento planejado, só vem quando não há processo
     **/
    plan_sof_val_orcado_atualizado: string | null

    /**
     * fonte: SMAE/ orçamento planejado cruzando pela dotação, só vem quando não há processo
     **/
    plan_valor_planejado: string | null

    /**
     * fonte: SMAE, para qual ano foi realizada a consulta no SOF
     **/
    plan_dotacao_ano_utilizado: number | null
    /**
     * fonte: SMAE, para qual mês foi realizada a consulta no SOF
     **/
    plan_dotacao_mes_utilizado: number | null

    /**
     * fonte: SOF/ valor de empenho até o ano/mes utilizado
     **/
    dotacao_valor_empenhado: string

    /**
     * fonte: SOF/ valor liquidado até o ano/mes utilizado
     **/
    dotacao_valor_liquidado: string

    /**
     * fonte: SMAE, para qual ano foi realizada a consulta no SOF do realizado
     **/
    dotacao_ano_utilizado: number
    /**
     * fonte: SMAE, para qual mês foi realizada a consulta no SOF do realizado
     **/
    dotacao_mes_utilizado: number

    /**
     * fonte: SMAE, soma ou valor do valor empenhado
     **/
    smae_valor_empenhado: string

    /**
     * fonte: SMAE, soma ou valor do valor liquidado
     **/
    smae_valor_liquidado: string
}

export class ListOrcamentoExecutadoDto {
    linhas: OrcamentoExecutadoSaidaDto[]
}