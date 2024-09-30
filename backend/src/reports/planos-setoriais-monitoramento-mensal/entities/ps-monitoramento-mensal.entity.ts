export class RelMonitoramentoMensalPsIndicadores {
    codigo_meta: string;
    titulo_meta:string;
    codigo_iniciativa:string;
    titulo_iniciativa:string;
    codigo_indicador:string;
    titulo_indicador:string;
    serie:string;
    data_referencia:string;
    valor:number;
    data_proximo_ciclo:string;
}

export class RelPsMonitoramentoMensalVariaveis {
    id_indicador: number;
    codigo_indicador: string;
    titulo_indicador:string;
    id_variavel:number;
    codigo_variavel:string;
    titulo_variavel:string;
    id_municipio:number;
    municipio:string;
    id_regiao:number;
    regiao:string;
    id_subprefeitura:number;
    subprefeitura:string;
    id_distrito:number;
    distrito:string;
    serie:string;
    data_referencia:string;
    valor:number;
    data_preenchimento:string;
    data_proximo_ciclo:string;
    analise_qualitativa_coleta:string;
    analise_qualitativa_aprovador:string;
    analise_qualitativa_liberador:string;
}
