import { CodigoNome } from '../../../common/dto/CodigoNome.dto';
import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';

export class OrcamentoExecutadoSaidaDto {
    meta: IdCodTituloDto;
    iniciativa: IdCodTituloDto | null;
    atividade: IdCodTituloDto | null;

    dotacao: string;
    processo: string | null;
    nota_empenho: string | null;

    orgao: CodigoNome;
    unidade: CodigoNome;
    fonte: CodigoNome;

    /**
     * fonte: SMAE/ horário que o SMAE foi buscar a dotação
     **/
    plan_dotacao_sincronizado_em: string | null;

    /**
     * fonte: SOF/ orçamento planejado, só vem quando não há processo
     **/
    plan_sof_val_orcado_atualizado: string | null;

    /**
     * fonte: SMAE/ orçamento planejado cruzando pela dotação, só vem quando não há processo
     **/
    plan_valor_planejado: string | null;

    /**
     * fonte: SMAE, para qual ano foi realizada a consulta no SOF
     **/
    plan_dotacao_ano_utilizado: string | null;
    /**
     * fonte: SMAE, para qual mês foi realizada a consulta no SOF
     **/
    plan_dotacao_mes_utilizado: string | null;

    /**
     * fonte: SMAE/ horário que o SMAE foi buscar a dotação
     **/
    dotacao_sincronizado_em: string;
    /**
     * fonte: SOF/ valor de empenho até o ano/mes utilizado
     **/
    dotacao_valor_empenhado: string;

    /**
     * fonte: SOF/ valor liquidado até o ano/mes utilizado
     **/
    dotacao_valor_liquidado: string;

    /**
     * fonte: SMAE, para qual ano foi realizada a consulta no SOF do realizado
     **/
    dotacao_ano_utilizado: string;
    /**
     * fonte: SMAE, para qual mês foi realizada a consulta no SOF do realizado
     **/
    dotacao_mes_utilizado: string;

    /**
     * fonte: SMAE, soma ou valor do valor empenhado
     **/
    smae_valor_empenhado: string;

    /**
     * fonte: SMAE, soma ou valor do valor liquidado
     **/
    smae_valor_liquidado: string;

    /**
     * fonte: SMAE, mês do registro, em caso de Consolidado é sempre em branco
     **/
    mes: string;

    /**
     * fonte: SMAE, mês mais alto dentro do orçamento é marcado como TRUE
     **/
    mes_corrente: boolean;

    /**
     * fonte: SMAE, ano do registro, em caso de Consolidado é sempre em branco
     **/
    ano: string;

    logs: string[];
}

export class OrcamentoPlanejadoSaidaDto {
    meta: IdCodTituloDto;
    iniciativa: IdCodTituloDto | null;
    atividade: IdCodTituloDto | null;

    dotacao: string;

    orgao: CodigoNome;
    unidade: CodigoNome;
    fonte: CodigoNome;

    /**
     * fonte: SMAE/ horário que o SMAE foi buscar a dotação
     **/
    plan_dotacao_sincronizado_em: string;

    /**
     * fonte: SOF/ orçamento planejado, só vem quando não há processo
     **/
    plan_sof_val_orcado_atualizado: string;

    /**
     * fonte: SMAE/ orçamento planejado cruzando pela dotação, só vem quando não há processo
     **/
    plan_valor_planejado: string;

    /**
     * fonte: SMAE, para qual ano foi realizada a consulta no SOF
     **/
    plan_dotacao_ano_utilizado: string;
    /**
     * fonte: SMAE, para qual mês foi realizada a consulta no SOF
     **/
    plan_dotacao_mes_utilizado: string;

    /**
     * fonte: SMAE, ano do registro, em caso de Consolidado é sempre em branco
     **/
    ano: string;

    logs: string[];
}

export class ListOrcamentoExecutadoDto {
    /**
     * merge do planejado e executado, somando os custos do periodo informado
     */
    linhas: OrcamentoExecutadoSaidaDto[];
    /**
     * para cada linha não encontrada de dotação, que estiver com os anos entre o inicio e o fim
     * será adicionado aqui os dados do planejado
     */
    linhas_planejado: OrcamentoPlanejadoSaidaDto[];
}
