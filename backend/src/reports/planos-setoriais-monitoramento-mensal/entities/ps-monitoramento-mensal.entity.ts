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
    indicador_id: number;
    codigo_indicador: string;
    titulo_indicador:string;
    variavel_id:number;
    codigo_variavel:string;
    titulo_variavel:string;
    municipio_id:number;
    municipio:string;
    regiao_id:number;
    regiao:string;
    subprefeitura_id:number;
    subprefeitura:string;
    distrito_id:number;
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
