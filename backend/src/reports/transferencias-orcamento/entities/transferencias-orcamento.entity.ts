import { CodigoNome } from '../../../common/dto/CodigoNome.dto';

export class RelTransferenciasOrcamentoDto {
    transferencia_id: number;
    transferencia_identificador: string;
    esfera: string;
    tipo: string;
    ano: number | null;

    distribuicao_id: number | null;
    distribuicao_nome: string | null;
    orgao_gestor: string | null;

    dotacao: string;
    processo: string | null;
    nota_empenho: string | null;
    ano_referencia: number;
    mes: number;
    acao_orcamentaria: string;

    orgao: CodigoNome;
    unidade: CodigoNome;
    fonte: CodigoNome;

    smae_valor_empenhado: string;
    smae_valor_liquidado: string;
    smae_percentual_empenho: string | null;
    smae_percentual_liquidado: string | null;

    dotacao_valor_empenhado: string | null;
    dotacao_valor_liquidado: string | null;
    dotacao_ano_utilizado: string;
    dotacao_mes_utilizado: string;
    dotacao_sincronizado_em: string | null;
}

export class RelatorioTransferenciasOrcamentoDto {
    linhas: RelTransferenciasOrcamentoDto[];
}
