export class RelTribunalDeContasDto {
    ano: number | null;
    parlamentar: string;
    status: string | null;
    valor_repasse: string | null;
    acao: string;
    gestor_municipal: string;
    prazo_vigencia: string | null;
    emenda: string | null;
    programa: number | null;
    // Estes dois campos serão preenchidos com string vazia.
    // Pois serão preenchidos manualmente.
    dotacao_orcamentaria: string;
    rubrica_de_receita: string;
}

export class RelatorioTribunalDeContasDto {
    linhas: RelTribunalDeContasDto[];
}
