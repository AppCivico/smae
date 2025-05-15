export class RelTribunalDeContasDto {
    ano: number | null;
    parlamentar: string;
    status: string | null;
    valor_repasse: string | null;
    acao: string;
    gestor_municipal: string;
    prazo_vigencia: string | null;
    emenda: string | null;
    programa: string | null;
    // Estes dois campos serão preenchidos com string vazia.
    // Pois serão preenchidos manualmente.
    dotacao_orcamentaria: string;
    rubrica_de_receita: string;
    finalidade: string | null;
    valor_empenho: number | null;
    liquidacao_pagamento: number | null;
}

export class RelatorioTribunalDeContasDto {
    linhas: RelTribunalDeContasDto[];
}
