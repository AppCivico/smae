export class PainelEstrategicoResponseDto {
    grandes_numeros:PainelEstrategicoGrandesNumeros;
    projeto_status:PainelEstrategicoProjetoStatus[];
    projeto_etapas:PainelEstrategicoProjetoEtapa[];
    projeto_orgao_responsavel:PainelEstrategicoOrgaoResponsavel[];
    projetos_concluidos_mes:PainelEstrategicoProjetosMesAno[];
    projetos_planejados_mes:PainelEstrategicoProjetosMesAno[];
    projetos_concluidos_ano:PainelEstrategicoProjetosAno[];
    projetos_planejados_ano:PainelEstrategicoProjetosAno[];
    anos_mapa_calor_planejados:number[];
    anos_mapa_calor_concluidos:number[];
    quantidades_projeto:PainelEstrategicoQuantidadesAnoCorrente;
    resumo_orcamentario:PainelEstrategicoResumoOrcamentario;
}
export class PainelEstrategicoListaProjetoResponseDto{
    lista:PainelEstrategicoProjeto[];
}

export class PainelEstrategicoGrandesNumeros {
    total_projetos: number;
    total_orgaos:number;
    total_metas:number;
}

export class PainelEstrategicoProjetoStatus {
    status: string;
    quantidade:number;
}

export class PainelEstrategicoProjetoEtapa {
    etapa: string;
    quantidade:number;
}
export class PainelEstrategicoOrgaoResponsavel {
    orgao_sigla:string;
    orgao_descricao:string;
    quantidade:number;
}
export class PainelEstrategicoProjetosMesAno {
    ano:number;
    mes:number;
    coluna:number;
    linha:number;
    quantidade:number;
}
export class PainelEstrategicoProjetosAno {
    ano:number;
    quantidade:number;
}
export class PainelEstrategicoQuantidadesAnoCorrente{
    quantidade_planejada:number;
    quantidade_concluida:number;
}
export class PainelEstrategicoResumoOrcamentario{
    custo_planejado_total:number;
    valor_empenhado_total:number;
    valor_liquidado_total:number;
}
export class PainelEstrategicoProjeto{
    nome:string;
    secretaria:string;
    meta:string;
    status:string;
    etapa_atual:string;
    termino_projetado:string;
    riscos_abertos:number;
    percentual_atraso:number;
}
