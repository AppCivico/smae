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
    dotacao_orcamentaria: string | null;
    // Preenchido com string vazia quando ausente: o campo é completado manualmente.
    rubrica_de_receita: string;
    finalidade: string | null;
    // Monetários trafegam como string para preservar a precisão do Decimal do Prisma.
    valor_empenho: string | null;
    liquidacao_pagamento: string | null;
}

export class RelatorioTribunalDeContasDto {
    linhas: RelTribunalDeContasDto[];
}
