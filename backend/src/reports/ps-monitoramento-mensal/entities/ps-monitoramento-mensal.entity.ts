export class RelMonitoramentoMensalPsIndicadores {
    meta_codigo: string;
    titulo_meta:string;
    iniciativa_codigo:string;
    iniciativa_titulo:string;
    indicador_codigo:string;
    indicador_titulo:string;
    serie:string;
    data_referencia:string;
    valor:number;
    data_proximo_ciclo:string;
}

export class RelPsMonitoramentoMensalVariaveis {
    indicador_id: number;
    indicador_codigo: string;
    indicador_titulo:string;
    variavel_id:number;
    variavel_codigo:string;
    variavel_titulo:string;
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
